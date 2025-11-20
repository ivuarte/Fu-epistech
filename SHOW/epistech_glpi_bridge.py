#!/usr/bin/env python3
"""
Epistech → GLPI Bridge
-------------------------------------
Monitorea la tabla `GestionEventos` y crea un ticket en GLPI por cada fila nueva.
Luego agrega un comentario con pruebas de red (ping, traceroute y test TCP) contra la IP:PORT
extraída del campo `sistemaImpactado` (formato esperado: URL como http://IP:PORT/... o https://IP:PORT/...).

Requisitos:
- Python 3.10+
- Paquetes: requests, PyMySQL, python-dotenv

Instalación rápida:
  pip install requests PyMySQL python-dotenv

Variables de entorno (archivo .env en el mismo directorio):
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USER=glpi
  DB_PASSWORD=glpi
  DB_NAME=epistech
  GLPI_API_URL=https://glpi.iammtechs.com/apirest.php
  GLPI_USER_TOKEN=VWuR0IRyOVNPVeMFnNddElDYNO7R6avn6NukwVBV
  GLPI_APP_TOKEN=42w9Ven7zkDytsJhE8a1kcDpIqYoESVocwGJyIcU
  POLL_SECONDS=10

Ejecución:
  python epistech_glpi_bridge.py

(Optativo) systemd unit ejemplo al final de este archivo.
"""
from __future__ import annotations
import os
import re
import time
import json
import socket
import platform
import subprocess
from dataclasses import dataclass
from typing import Optional, Tuple

import pymysql
import requests
from dotenv import load_dotenv
from shutil import which as shutil_which


# --------------- Config & Utilidades ---------------
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "glpi")
DB_PASSWORD = os.getenv("DB_PASSWORD", "glpi")
DB_NAME = os.getenv("DB_NAME", "epistech")

GLPI_API_URL = os.getenv("GLPI_API_URL")
GLPI_USER_TOKEN = os.getenv("GLPI_USER_TOKEN")
GLPI_APP_TOKEN = os.getenv("GLPI_APP_TOKEN")

POLL_SECONDS = int(os.getenv("POLL_SECONDS", "10"))
STATE_TABLE = "IntegrationState"
STATE_KEY = "gestion_last_id"

assert GLPI_API_URL and GLPI_USER_TOKEN and GLPI_APP_TOKEN, "Config GLPI incompleta (GLPI_API_URL/GLPI_USER_TOKEN/GLPI_APP_TOKEN)"

HEADERS_BASE = {
    "Content-Type": "application/json",
    "App-Token": GLPI_APP_TOKEN,
}

@dataclass
class GestionEvento:
    id: int
    eventid: int
    comentario: str
    responsable: str
    clienteImpactado: str
    sistemaImpactado: str
    IdUser: int
    fecha_gestion: str

# --------------- DB helpers ---------------

def get_db_conn():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )

def ensure_state_table(conn):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {STATE_TABLE} (
                sk VARCHAR(64) PRIMARY KEY,
                sval BIGINT NOT NULL DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )
        # init row if missing
        cur.execute(f"SELECT COUNT(*) c FROM {STATE_TABLE} WHERE sk=%s", (STATE_KEY,))
        if cur.fetchone()["c"] == 0:
            cur.execute(
                f"INSERT INTO {STATE_TABLE} (sk, sval) VALUES (%s, %s)", (STATE_KEY, 0)
            )

def get_last_processed_id(conn) -> int:
    with conn.cursor() as cur:
        cur.execute(f"SELECT sval FROM {STATE_TABLE} WHERE sk=%s", (STATE_KEY,))
        row = cur.fetchone()
        return int(row["sval"]) if row else 0

def set_last_processed_id(conn, last_id: int):
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {STATE_TABLE} SET sval=%s WHERE sk=%s", (last_id, STATE_KEY)
        )

def fetch_new_gestion(conn, after_id: int) -> list[GestionEvento]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, eventid, comentario, responsable, clienteImpactado, sistemaImpactado, IdUser, fecha_gestion
            FROM GestionEventos
            WHERE id > %s
            ORDER BY id ASC
            """,
            (after_id,),
        )
        rows = cur.fetchall()
    return [GestionEvento(**r) for r in rows]

def fetch_problem_name(conn, eventid: int) -> Optional[str]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT name FROM ProblemasZabbix WHERE eventid=%s ORDER BY id DESC LIMIT 1",
            (eventid,),
        )
        row = cur.fetchone()
        return row["name"] if row else None

# --------------- Network tests ---------------

# Acepta http/https + IPv4/IPv6 + puerto. No exige que termine al final (soporta /path).
_url_host_port_re = re.compile(
    r"^(?P<scheme>https?)://(?P<host>\[?[A-Za-z0-9\-\.:]+\]?)(?::(?P<port>\d+))?"
)

from urllib.parse import urlsplit

def parse_host_port(url_or_text: str) -> Tuple[str, int, str]:
    s = (url_or_text or "").strip()
    # 1) Intento robusto: URL real
    try:
        u = urlsplit(s)
        if u.scheme in ("http", "https") and u.hostname:
            host = u.hostname
            port = u.port or (443 if u.scheme == "https" else 80)
            return host, port, u.scheme
    except Exception:
        pass
    # 2) host:port[/path] o solo host
    s2 = s.split("/", 1)[0]
    if ":" in s2:
        host, port = s2.split(":", 1)
        return host, int(port), "tcp"
    return s2, 80, "tcp"


def run_cmd(cmd: list[str], timeout: int = 15) -> str:
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, timeout=timeout)
        return out.decode(errors="ignore")
    except subprocess.CalledProcessError as e:
        return e.output.decode(errors="ignore")
    except Exception as e:
        return f"<error: {type(e).__name__}: {e}>"

def ping_host(host: str) -> str:
    # forzar solo host (sin puerto)
    host_only = host.split(":")[0]
    if platform.system().lower().startswith("win"):
        return run_cmd(["ping", "-n", "4", host_only], timeout=20)
    return run_cmd(["ping", "-c", "4", "-W", "3", host_only], timeout=20)

def traceroute_host(host: str) -> str:
    host_only = host.split(":")[0]
    if platform.system().lower().startswith("win"):
        return run_cmd(["tracert", "-d", host_only], timeout=60)
    # UDP por defecto; si tienes permisos y binario con ICMP, usa -I
    return run_cmd(["traceroute", "-n", "-m", "15", host_only], timeout=60)

def shutil_which(name: str) -> Optional[str]:
    from shutil import which
    return which(name)

def tcp_connect_test(host: str, port: int, timeout: float = 5.0) -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((host, port))
        return f"TCP connect to {host}:{port} OK (<= {timeout}s)"
    except Exception as e:
        return f"TCP connect to {host}:{port} FAILED: {e}"
    finally:
        try:
            s.close()
        except Exception:
            pass

# --------------- GLPI API client ---------------

class GlpiClient:
    def __init__(self, base_url: str, app_token: str, user_token: str):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({"App-Token": app_token, "Content-Type": "application/json"})
        # Autorización por user_token en header Authorization
        self._auth_header = {"Authorization": f"user_token {user_token}"}
        self.session_token: Optional[str] = None

    def init_session(self):
        url = f"{self.base_url}/initSession"
        r = self.session.get(url, headers=self._auth_header, timeout=20)
        r.raise_for_status()
        data = r.json()
        self.session_token = data.get("session_token")
        if not self.session_token:
            raise RuntimeError("No se obtuvo session_token de GLPI")
        self.session.headers["Session-Token"] = self.session_token

    def kill_session(self):
        if not self.session_token:
            return
        url = f"{self.base_url}/killSession"
        try:
            self.session.get(url, timeout=10)
        finally:
            self.session_token = None
            self.session.headers.pop("Session-Token", None)

    def create_ticket(self, name: str, content: str, urgency: int = 3, impact: int = 2, requesttypes_id: int = 2) -> int:
        url = f"{self.base_url}/Ticket/"
        payload = {
            "input": {
                "name": name,
                "content": content,
                "urgency": urgency,
                "impact": impact,
                "requesttypes_id": requesttypes_id,
                # agrega más campos si lo necesitas (entidades, categorías, etc.)
            }
        }
        r = self.session.post(url, data=json.dumps(payload), timeout=30)
        r.raise_for_status()
        j = r.json()
        # Respuesta estándar: {"id": <ticket_id>} o lista en algunos casos
        if isinstance(j, dict) and "id" in j and j["id"]:
            return int(j["id"]) 
        if isinstance(j, list) and j and isinstance(j[0], dict) and j[0].get("id"):
            return int(j[0]["id"])  # fallback por si API devuelve lista
        raise RuntimeError(f"No se pudo obtener id del ticket: {j}")

    def add_followup(self, ticket_id: int, content: str, is_private: int = 0):
        # Método recomendado: POST /ITILFollowup/ con itemtype Ticket + items_id
        url = f"{self.base_url}/ITILFollowup/"
        payload = {
            "input": {
                "itemtype": "Ticket",
                "items_id": int(ticket_id),
                "content": content,
                "is_private": int(is_private),
            }
        }
        r = self.session.post(url, data=json.dumps(payload), timeout=30)
        r.raise_for_status()
        return r.json()

# --------------- Formateo de contenidos ---------------

def build_ticket_title(evento: GestionEvento, problem_name: Optional[str]) -> str:
    if problem_name:
        return f"Evento {evento.eventid} - {problem_name}"[:250]
    return f"Evento {evento.eventid} generado desde epistech"[:250]

def build_ticket_body(evento: GestionEvento, problem_name: Optional[str]) -> str:
    parts = [
        "**Contexto de GestiónEventos**",
        f"- comentario: {evento.comentario or '-'}",
        f"- responsable: {evento.responsable or '-'}",
        f"- clienteImpactado: {evento.clienteImpactado or '-'}",
        f"- sistemaImpactado: {evento.sistemaImpactado or '-'}",
    ]
    if problem_name:
        parts.append("")
        parts.append("**Descripción (ProblemasZabbix.name):**")
        parts.append(problem_name)
    return "\n".join(parts)

def build_followup_from_tests(host: str, port: int, scheme: str,
                              ping_out: str, trace_out: str, telnet_out: str,
                              raw: str = "") -> str:
    host_only = host.split(":")[0]
    raw_line = f"**sistemaImpactado (raw)**: `{raw}`\n" if raw else ""
    return (
        "Resultados de pruebas automáticas sobre el objetivo extraído de `sistemaImpactado`:\n\n"
        f"{raw_line}"
        f"**Objetivo (parseado)**: `{scheme}://{host_only}:{port}`\n\n"
        "**PING (4 paquetes)**:\n"
        f"```\n{ping_out.strip()[:5000]}\n```\n\n"
       # "**Traceroute**:\n"
       # f"```\n{trace_out.strip()[:5000]}\n```\n\n"
        "**Prueba de puerto (nc/TCP)**:\n"
        f"```\n{telnet_out.strip()[:2000]}\n```\n"
    )



def telnet_test(host: str, port: int, timeout: int = 5) -> str:
    host_only = host.split(":")[0]
    # 1) usa nc si existe: salida corta y adecuada
    if shutil_which("nc"):
        return run_cmd(["nc", "-vz", host_only, str(port)], timeout=timeout)
    # 2) fallback: TCP connect y cierra
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((host_only, port))
        return f"Port {host_only}:{port} OPEN (TCP connect OK)"
    except Exception as e:
        return f"Port {host_only}:{port} CLOSED/ERROR: {e}"
    finally:
        try: s.close()
        except: pass


def summarize_tests(ping_out: str, trace_out: str, telnet_out: str) -> str:
    def first_line(s: str) -> str:
        for line in (s or "").splitlines():
            if line.strip():
                return line.strip()[:240]
        return "(sin salida)"
    return (
        f"PING: {first_line(ping_out)} | "
        f"TRAZA: {first_line(trace_out)} | "
        f"TELNET: {first_line(telnet_out)}"
    )

class RetellClient:
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.retellai.com/v2"):
        self.api_key = api_key or os.getenv("RETELL_API_KEY", "")
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        if not self.api_key:
            print("[RETELL] Advertencia: falta RETELL_API_KEY")
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        })

    def create_phone_call(self, from_number: str, to_number: str, agent_id: str, variables: dict) -> dict:
        url = f"{self.base_url}/create-phone-call"
        payload = {
            "from_number": from_number,
            "to_number": to_number,
            "agent_id": agent_id,
            "retell_llm_dynamic_variables": variables,
        }
        r = self.session.post(url, data=json.dumps(payload), timeout=30)
        try:
            r.raise_for_status()
        except Exception:
            return {"error": True, "status": r.status_code, "text": r.text}
        return r.json()

def get_current_contact(conn) -> Optional[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM disponibles
            WHERE Disponible=1
              AND NOW() BETWEEN FechaInicioDisponibilidad AND FechaFinDisponibilidad
            ORDER BY Nivel ASC, Id ASC
            LIMIT 1
            """
        )
        return cur.fetchone()


# --------------- Main loop ---------------

def process_new_rows():
    conn = get_db_conn()
    ensure_state_table(conn)
    last_id = get_last_processed_id(conn)
    print(f"Iniciando. Último id procesado: {last_id}")

    glpi = GlpiClient(GLPI_API_URL, GLPI_APP_TOKEN, GLPI_USER_TOKEN)
    glpi.init_session()
    try:
        while True:
            nuevos = fetch_new_gestion(conn, last_id)
            if not nuevos:
                time.sleep(POLL_SECONDS)
                continue

            for ev in nuevos:
                print(f"Procesando GestionEventos.id={ev.id} eventid={ev.eventid}")
                problem_name = fetch_problem_name(conn, ev.eventid)
                title = build_ticket_title(ev, problem_name)
                body = build_ticket_body(ev, problem_name)

                # 1) Crear ticket en GLPI
                ticket_id = glpi.create_ticket(name=title, content=body)
                print(f"  → Ticket creado: #{ticket_id}")

                # 2) Ejecutar pruebas de red contra sistemaImpactado
                try:
                    host, port, scheme = parse_host_port(ev.sistemaImpactado or "")
                except Exception:
                    host, port, scheme = ("", 0, "tcp")

                if not host:
                    followup_text = (
                        "No se pudo extraer un destino válido de `sistemaImpactado`. "
                        f"Valor: {ev.sistemaImpactado!r}"
                    )
                    pruebas_resumen = "No fue posible ejecutar pruebas (destino inválido)."
                else:
                    ping_out = ping_host(host)          # solo IP
                    trace_out = traceroute_host(host)   # solo IP
                    telnet_out = telnet_test(host, port)  # puerto sí cuenta
                    followup_text = build_followup_from_tests(host, port, scheme, ping_out, trace_out, telnet_out, raw=ev.sistemaImpactado)
                    pruebas_resumen = summarize_tests(ping_out, trace_out, telnet_out)

                # 3) Agregar comentario (followup)
                glpi.add_followup(ticket_id, followup_text)
                print(f"  → Followup agregado al ticket #{ticket_id}")

                # 4) Llamar al disponible con Retell (si hay)
                try:
                    contacto = get_current_contact(conn)
                    if contacto:
                        retell = RetellClient()
                        from_number = os.getenv("RETELL_FROM_NUMBER", "")  # ej: +1XXXXXXXXXX (número de Retell)
                        agent_id = os.getenv("RETELL_AGENT_ID", "agent_e1951f64d5a2369db3e1aa26bb")

                        # normaliza destino agregando prefijo país si hace falta
                        to_number = str(contacto.get("Contacto", "")).strip()
                        if to_number and not to_number.startswith("+"):
                            cc = os.getenv("RETELL_DEFAULT_CC", "+57")
                            to_number = cc + to_number

                        variables = {
                            # Variables para el prompt del agente (ver más abajo)
                            "Nombre": contacto.get("Nombre", "Ingeniero"),
                            "Asunto_Alerta_Impactada": title,
                            "Servicios_Impactados": ev.clienteImpactado or ev.sistemaImpactado or "(sin dato)",
                            "Pruebas_realizadas": pruebas_resumen,
                            "Ticket": str(ticket_id),
                        }

                        resp = retell.create_phone_call(
                            from_number=from_number,
                            to_number=to_number,
                            agent_id=agent_id,
                            variables=variables,
                        )
                        glpi.add_followup(ticket_id, f"Notificación telefónica enviada a {contacto.get('Nombre')} ({to_number}). Respuesta Retell: {json.dumps(resp)[:1800]}")
                        print(f"  → Llamada Retell iniciada para {to_number}")
                    else:
                        print("  → No hay contacto disponible en ventana de disponibilidad")
                except Exception as e:
                    print(f"  → Error Retell: {e}")

                # 5) Avanzar puntero de estado
                last_id = ev.id
                set_last_processed_id(conn, last_id)

            # pequeña pausa antes de la siguiente iteración
            time.sleep(1)
    finally:
        glpi.kill_session()
        conn.close()


if __name__ == "__main__":
    try:
        process_new_rows()
    except KeyboardInterrupt:
        print("Interrumpido por usuario.")
    except Exception as e:
        print(f"Error fatal: {e}")

"""
# Ejemplo de unit file para systemd (/etc/systemd/system/epistech-glpi-bridge.service)

[Unit]
Description=Epistech → GLPI Bridge
After=network-online.target mariadb.service
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/epistech-glpi-bridge
EnvironmentFile=/opt/epistech-glpi-bridge/.env
ExecStart=/usr/bin/python3 /opt/epistech-glpi-bridge/epistech_glpi_bridge.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""

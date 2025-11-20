import { Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Setting from './components/setting';
import Problems from './components/Problems';
import Management from './components/management';
import Matrizraci from './components/Matrizraci';


const App = () => {
  return (
    <>
 
    
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/management" element={<Management />} />
          <Route path="/matrizraci" element={<Matrizraci />} />
        </Routes>
    
    </>
  );
};

export default App;

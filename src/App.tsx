import { ConfigProvider, theme } from 'antd';
import MainPage from './pages/MainPage';

export default function App() {
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <MainPage />
    </ConfigProvider>
  );
}

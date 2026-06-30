import { observer } from "mobx-react-lite";
import LoginForm from "../components/LoginForm";
import PlayerPage from "../pages/PlayerPage";
import { rootStore } from "../stores/rootStore";

const MainPage: React.FC = observer(() => {
    return rootStore.userStore.username
        ? <PlayerPage />
        : <LoginForm />;
});

export default MainPage;
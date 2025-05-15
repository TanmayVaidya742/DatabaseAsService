import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import UsersRoute from '@routes/users.route';
import validateEnv from '@utils/validateEnv';
import OrgsRoute from './routes/org.route';
import DatabaseRoute from './routes/database.routes';

validateEnv();

const app = new App([new IndexRoute(), new UsersRoute(), new AuthRoute(), new OrgsRoute(), new DatabaseRoute()]);

app.listen();

import { env } from './config/env';
import { buildApp } from './app';

/**
 * Start the Express server
 */
const app = buildApp();
app.listen(env.API_PORT, () => console.log(`Listening on port ${env.API_PORT}`));

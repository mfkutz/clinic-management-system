import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { router } from './routes';

export const app = express();

app.use(morgan('dev'));
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.use('/api', router);

app.use(notFoundHandler);
app.use(errorHandler);

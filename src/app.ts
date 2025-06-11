import express from "express";
import cors from "cors";
import router from "./routes";
import { welcome } from "./controllers";

const app = express();

app.use(cors());

app.use(express.json({ limit: "50mb" }));

app.use(express.urlencoded({ extended: false }));

app.get("/", welcome as any);

app.use(router);

export default app;

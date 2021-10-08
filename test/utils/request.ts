import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

export default supertest(BASE_URL);

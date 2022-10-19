import request from "supertest"
import { Connection } from "typeorm"

import { app } from "../../../../app";
import { createDatabaseConnection } from "../../../../database";

let connection: Connection;

describe("Authenticate User Controller", () => {
  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();
  })

  beforeEach(async () => {
    await connection.query("DELETE FROM users");
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close()
  })

  it("Should be able to create a session", async () => {
    const email = "user.test@fin_api.com";
    const password = "password123";
    const name = "User Test";

    const resCreateUser = await request(app)
      .post("/api/v1/users")
      .send({
        email,
        name,
        password,
      });

    expect(resCreateUser.status).toBe(201);

    const resCreateSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email,
        password,
      });

    expect(resCreateSession.status).toBe(200);
    expect(resCreateSession.body).toHaveProperty("token");
    expect(resCreateSession.body).toHaveProperty("user");
    expect(resCreateSession.body.user.name).toEqual(name);
  })

  it("Shouldn't be able to create user with incorrect email", async () => {
    const email = "user.test@fin_api.com";
    const password = "password123";

    const resCreateUser = await request(app)
      .post("/api/v1/users")
      .send({
        name: "User Test",
        email,
        password
      });

    expect(resCreateUser.status).toBe(201);

    const resCreateSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: "incorrect@fin_api.com",
        password
      });

    expect(resCreateSession.status).toBe(401);
    expect(resCreateSession.body).toEqual({message: "Incorrect email or password"});
  })

  it("Shouldn't be able to create user with incorrect password", async () => {
    const email = "user.test@fin_api.com";
    const password = "password123";

    const resCreateUser = await request(app)
      .post("/api/v1/users")
      .send({
        name: "User Test",
        email,
        password
      });

    expect(resCreateUser.status).toBe(201);

    const resCreateSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email,
        password: "incorrectPassword123"
      });

    expect(resCreateSession.status).toBe(401);
    expect(resCreateSession.body).toEqual({message: "Incorrect email or password"});
  })
})

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

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close()
  })

  it("Should be able to create a session", async () => {
    const email = "user.test@email.com";
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
})

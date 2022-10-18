import req from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import { createDatabaseConnection } from "../../../../database";

let connection: Connection;

describe("Show User Profile Controller", () => {
  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to get user data", async () => {

    const name = "User Test";
    const password = "password123";
    const email = "user.test@fin_api.com";

    const resCreateUser = await req(app)
      .post("/api/v1/users")
      .send({
        email,
        name,
        password,
      });

    expect(resCreateUser.status).toEqual(201);

    const resCreateSession = await req(app)
      .post("/api/v1/sessions")
      .send({
        email,
        password
      })

    expect(resCreateSession.status).toEqual(200);
    expect(resCreateSession.body).toHaveProperty("token");

    const { token } = resCreateSession.body;

    const resShowUser = await req(app)
      .get("/api/v1/profile")
      .set({
        Authorization: `Bearer ${token}`
      })

    expect(resShowUser.status).toEqual(200);

    expect(resShowUser.body).toHaveProperty("id");
    expect(resShowUser.body).toHaveProperty("name");
    expect(resShowUser.body).toHaveProperty("email");

    expect(resShowUser.body.name).toEqual(name);
    expect(resShowUser.body.email).toEqual(email);
  })
})

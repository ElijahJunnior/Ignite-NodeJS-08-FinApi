import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import { createDatabaseConnection } from "../../../../database";

let connection: Connection;

describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close()
  })

  it("Should be able to create a new user", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({
        name: "User Test",
        password: "password123",
        email: "user.test@fin_api.com"
      });

    expect(res.status).toEqual(201);
  })

  it("Shouldn't be able to create two users with the same email", async () => {
    await request(app)
      .post("/api/v1/users")
      .send({
        name: "User Failure Test",
        password: "password123",
        email: "user.failure.test@fin_api.com"
      });

    const res = await request(app)
      .post("/api/v1/users")
      .send({
        name: "User Failure Test",
        password: "password1234",
        email: "user.failure.test@fin_api.com"
      });

    expect(res.status).toEqual(400);
    expect(res.body).toEqual({
      message: "User already exists"
    });
  })
})

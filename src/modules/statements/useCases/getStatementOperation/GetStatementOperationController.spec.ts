import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";
import { createDatabaseConnection } from "../../../../database";

let connection: Connection;
let token: string;

describe("Get Statement Operation", () => {
  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();

    const email = "user.test@fin_api.com";
    const password = "password123";

    const resCreateUser = await request(app)
      .post("/api/v1/users")
      .send({
        email,
        name: "User Test",
        password
      });

    expect(resCreateUser.status).toBe(201);

    const resCreateSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email,
        password
      });

    expect(resCreateSession.status).toBe(200);
    expect(resCreateSession.body).toHaveProperty("token");

    token = resCreateSession.body.token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to get statement operations", async () => {
    const resCreateStatement = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 120.00,
        description: "Test deposit statement",
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(resCreateStatement.status).toBe(201);
    expect(resCreateStatement.body).toHaveProperty("id");

    const resGetStatement = await request(app)
      .get(`/api/v1/statements/${resCreateStatement.body.id}`)
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(resGetStatement.status).toBe(200);
    expect(resGetStatement.body).toHaveProperty("type");
    expect(resGetStatement.body).toHaveProperty("description");
    expect(resGetStatement.body.type).toEqual(resCreateStatement.body.type);
    expect(resGetStatement.body.description).toEqual(resCreateStatement.body.description);
  });

  it("Shouldn't be able to get statement operations without token", async () => {
    const resCreateStatement = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 120.00,
        description: "Test deposit statement",
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(resCreateStatement.status).toBe(201);
    expect(resCreateStatement.body).toHaveProperty("id");

    const resGetStatement = await request(app)
      .get(`/api/v1/statements/${resCreateStatement.body.id}`);

    expect(resGetStatement.status).toBe(401);
    expect(resGetStatement.body).toEqual({
      message: "JWT token is missing!"
    });
  })

  it("Shouldn't be able to get non-existent statement operations", async () => {
    const non_existent_id = uuid();

    const resGetStatement = await request(app)
      .get(`/api/v1/statements/${non_existent_id}`)
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(resGetStatement.status).toBe(404);
    expect(resGetStatement.body).toEqual({
      message: "Statement not found"
    });
  });
})

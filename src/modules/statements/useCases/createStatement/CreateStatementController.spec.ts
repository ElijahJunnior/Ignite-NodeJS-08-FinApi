import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";
import { createDatabaseConnection } from "../../../../database";

let connection: Connection;
let token: string;

describe("Create Statement Controller", () => {
  beforeAll(async () => {
    const email = "user.test@fin_api.com";
    const password = "password123";

    connection = await createDatabaseConnection();
    await connection.runMigrations();

    const resCreateUser = await request(app)
      .post("/api/v1/users")
      .send({
        email,
        password,
        name: "User Test",
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

    token = resCreateSession.body.token;

  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to create a deposit statement", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 120.00,
        description: "Test deposit statement"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  })
})

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

  afterEach(async() => {
    await connection.query("DELETE FROM statements");
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

  it("Should be able to create a withdraw statement", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 120.00,
        description: "Test deposit statement"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 120.00,
        description: "Test withdraw statement"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  })

  it("Shouldn't be able to create a deposit statement without token", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 120.00,
        description: "Test deposit statement"
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({message: "JWT token is missing!"});
  })

  it("Shouldn't be able to create a withdraw statement without token", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 120.00,
        description: "Test withdraw statement"
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({message: "JWT token is missing!"});
  })

  it("Shouldn't be able to create a withdraw statement without sufficient funds", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100.00,
        description: "Test deposit statement"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 120.00,
        description: "Test withdraw statement"
      })
      .set({
        Authorization: `Bearer ${token}`
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({message: "Insufficient funds"});
  })
})

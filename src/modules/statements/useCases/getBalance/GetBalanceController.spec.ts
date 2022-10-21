import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import { createDatabaseConnection } from "../../../../database";

let connection: Connection;
let token: string;

describe("Get Balance Controller", () => {
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

    token = resCreateSession.body.token;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to Get Ballance", async () => {
    const resDeposit01 = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 150.00,
        description: "Deposit 01",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(resDeposit01.status).toBe(201);

    const resDeposit02 = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 150.00,
        description: "Deposit 02",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(resDeposit02.status).toBe(201);

    const resWithdraw01 = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 100.00,
        description: "Withdraw 01",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(resWithdraw01.status).toBe(201);

    const resGetBalance = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(resGetBalance.status).toBe(200);
    expect(resGetBalance.body).toHaveProperty("balance");
    expect(resGetBalance.body).toHaveProperty("statement");
    expect(resGetBalance.body.balance).toBe(200);
    expect(resGetBalance.body.statement.length).toBe(3);
    expect(resGetBalance.body.statement[0].id).toBe(resDeposit01.body.id);
    expect(resGetBalance.body.statement[1].id).toBe(resDeposit02.body.id);
    expect(resGetBalance.body.statement[2].id).toBe(resWithdraw01.body.id);
  })

  it("Shouldn't be able to get balance without token", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "JWT token is missing!",
    });
  })
})

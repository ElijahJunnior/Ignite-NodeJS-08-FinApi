import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import { createDatabaseConnection } from "../../../../database";
import { AppError } from "../../../../shared/errors/AppError";

let connection: Connection;
let token: string;
let recipient_id: string;
let recipient_token: string;

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();

    // Creation of the common user
    const email = "user.test@fin_api.com";
    const password = "password123";

    const resCreateUser = await request(app)
      .post("/api/v1/users")
      .send({
        email,
        name: "User Test",
        password,
      });

    if (resCreateUser.status !== 201) {
      throw new AppError(
        "User creation error: " + resCreateUser.body.message
      );
    }

    // Creation of the common balance
    const resCreateSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email,
        password,
      });

    if (resCreateSession.status !== 200) {
      throw new AppError(
        "Session creation error: " + resCreateSession.body.message
      );
    }

    token = resCreateSession.body.token;

    // Creation of the recipient user
    const recipient_email = "recipient@fin_api.com";
    const recipient_password = "password123";

    const resRecipient = await request(app)
      .post("/api/v1/users")
      .send({
        email: recipient_email,
        name: "User Test",
        password: recipient_password,
      });

    if (resRecipient.status !== 201) {
      throw new AppError(
        "Recipient User creation error: " + resRecipient.body.message
      );
    }

    // Creation session for the recipient user
    const resRecipientSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: recipient_email,
        password: recipient_password,
      });

    if(resRecipientSession.status !== 200) {
      throw new AppError(
        "Recipient session creation error: " + resRecipient.body.message
      );
    }

    recipient_id = resRecipientSession.body.user.id;
    recipient_token = resRecipientSession.body.token;
  });

  afterEach(async () => {
    await connection.query("DELETE FROM statements");
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to get balance", async () => {
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

  it("Should be able to get balance after user send transfer statement", async () => {
    // Creation statement balance to initial balance
    const resStatement01 = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 150.00,
        description: "Initial balance",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    if (resStatement01.status !== 201) {
      throw new AppError(
        "Create deposit statement error: " + resStatement01.body.message
      );
    }

    // Creation of the transfer statement
    const resStatement02 = await request(app)
      .post("/api/v1/statements/transfer/" + recipient_id)
      .send({
        amount: 100.00,
        description: "Transfer statement",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    if (resStatement02.status !== 201) {
      throw new AppError(
        "Create transfer statement error: " + resStatement02.body.message
      );
    }

    // Consume get balance resource
    const resGetBalance = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(resGetBalance.status).toBe(200);
    expect(resGetBalance.body).toHaveProperty("balance");
    expect(resGetBalance.body).toHaveProperty("statement");
    expect(resGetBalance.body.balance).toBe(50);
    expect(resGetBalance.body.statement.length).toBe(2);
  })

  it("Should be able to get balance after user receive transfer statement", async () => {
    // Creation statement balance to initial balance
    const resStatement01 = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 150.00,
        description: "Initial balance",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    if (resStatement01.status !== 201) {
      throw new AppError(
        "Create deposit statement error: " + resStatement01.body.message
      );
    }

    // Creation of the transfer statement
    const resStatement02 = await request(app)
      .post("/api/v1/statements/transfer/" + recipient_id)
      .send({
        amount: 100.00,
        description: "Transfer statement",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    if (resStatement02.status !== 201) {
      throw new AppError(
        "Create transfer statement error: " + resStatement02.body.message
      );
    }

    // Consume get balance resource
    const resGetBalance = await request(app)
      .get("/api/v1/statements/balance")
      .set({
        Authorization: `Bearer ${recipient_token}`,
      });

    expect(resGetBalance.status).toBe(200);
    expect(resGetBalance.body).toHaveProperty("balance");
    expect(resGetBalance.body).toHaveProperty("statement");
    expect(resGetBalance.body.balance).toBe(100);
    expect(resGetBalance.body.statement.length).toBe(1);
  })
})

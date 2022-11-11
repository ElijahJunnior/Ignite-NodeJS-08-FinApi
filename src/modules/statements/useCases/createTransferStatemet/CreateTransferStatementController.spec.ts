import request from "supertest";
import { Connection } from "typeorm"
import { app } from "../../../../app";

import { createDatabaseConnection } from "../../../../database";
import { AppError } from "../../../../shared/errors/AppError";

let connection: Connection;
let senderUserID: string;
let recipientUserID: string;
let senderUserToken: string;

describe("Create Transfer Statement Controller", () => {
  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();

    const email = "sender.user@fin_api.com.br";
    const password = "password123";

    const resSenderUser = await request(app)
     .post("/api/v1/users")
     .send({
        name: "Sender User",
        email,
        password,
      });

    if(resSenderUser.status !== 201) {
      throw new AppError(
        "Sender User creation error: " + resSenderUser?.body?.message
      );
    }

    senderUserID = resSenderUser.body.id;

    const resRecipientUser = await request(app)
      .post("/api/v1/users")
      .send({
        name: "Recipient User",
        email: "recipient.user@fin_api.com.br",
        password: "password123",
      });

    if(resRecipientUser.status !== 201) {
      throw new AppError(
        "Recipient User creation error: " + resRecipientUser?.body?.message
      );
    }

    recipientUserID = resRecipientUser.body.id;

    const resCreateSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email,
        password,
      });

    if(resCreateSession.status !== 200) {
      throw new AppError(
        "Sender User Session creation error: " + resCreateSession?.body?.message
      );
    }

    senderUserToken = resCreateSession.body.token;
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to create a Transfer Statement", async () => {
    const resCreateInitialBalance = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 200,
        description: "Initial Balance"
      })
      .set({
        Authorization: `Bearer ${senderUserToken}`
      });

    if(resCreateInitialBalance.status !== 201) {
      throw new AppError(
        "Create opening balance error: " + resCreateInitialBalance?.body?.message
      );
    }

    const resTransferStatement = await request(app)
      .post(`/api/v1/statements/transfer/${recipientUserID}`)
      .send({
        amount: 150,
        description: "Test Transfer Statement"
      })
      .set({
        Authorization: `Bearer ${senderUserToken}`
      });

    expect(resTransferStatement.status).toBe(201);
    expect(resTransferStatement.body).toHaveProperty("id");
  })
})

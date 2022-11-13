import request from "supertest";
import { Connection } from "typeorm"
import { app } from "../../../../app";

import { createDatabaseConnection } from "../../../../database";
import { AppError } from "../../../../shared/errors/AppError";

let connection: Connection;
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

    const resSenderSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email,
        password,
      });

    if(resSenderSession.status !== 200) {
      throw new AppError(
        "Sender User Session creation error: " + resSenderSession?.body?.message
      );
    }

    senderUserToken = resSenderSession.body.token;

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

    const resRecipientSession = await request(app)
      .post("/api/v1/sessions")
      .send({
        email,
        password,
      });

    if(resRecipientSession.status !== 200) {
      throw new AppError(
        "Recipient User Session creation error: " + resRecipientSession?.body?.message
      );
    }

    recipientUserID = resRecipientSession.body.user.id;
  })

  afterEach(async () => {
    await connection.query("DELETE FROM statements;");
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

  it("Shouldn't be able to create a Transfer Statement without funds", async () => {
    const resCreateInitialBalance = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
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

    expect(resTransferStatement.status).toBe(400);
    expect(resTransferStatement.body).toEqual({message: "Insufficient Founds!"});
  })

  it("Shouldn't be able to create a Transfer Statement without auth key", async () => {
    const resStatement = await request(app)
      .post(`/api/v1/statements/transfer/${recipientUserID}`)
      .send({
        amount: 150,
        description: "Test Transfer Statement"
      });

    expect(resStatement.status).toBe(401);
    expect(resStatement.body).toEqual({message: "JWT token is missing!"});
  })

  it("Shouldn't be able to create a Transfer Statement without valid Recipient User", async () => {
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

    const resStatement = await request(app)
      .post("/api/v1/statements/transfer/368069f0-de55-5ca6-9ed6-147619eedb82")
      .send({
        amount: 150,
        description: "Test Transfer Statement"
      })
      .set({
        Authorization: `Bearer ${senderUserToken}`
      });

    expect(resStatement.status).toBe(404);
    expect(resStatement.body).toEqual({message: "Recipient User not found!"});
  })
})

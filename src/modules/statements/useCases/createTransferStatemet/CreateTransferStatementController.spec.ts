import { Connection } from "typeorm"
import { createDatabaseConnection } from "../../../../database";

let connection: Connection;

describe("Create Transfer Statement Controller", () => {
  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })
})

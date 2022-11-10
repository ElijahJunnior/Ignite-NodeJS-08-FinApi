import { Statement } from "../../entities/Statement";

type CreateTransferStatementDTO =  Pick<Statement,
  "user_id" |
  "sender_id" |
  "description" |
  "amount" |
  "type"
>

export { CreateTransferStatementDTO };

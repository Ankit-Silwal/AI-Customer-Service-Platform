import { Queue } from "bullmq";

const connection={
  host:"localhost",
  port:6666
}

export const documentQueue=new Queue(
  "document-processing",{
    connection
  }
)
export interface MessageObject {
  from: string;
  text: string;
  date: Date;
  reply_to_message: number | null;
}

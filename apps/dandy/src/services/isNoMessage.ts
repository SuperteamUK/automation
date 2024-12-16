export function isNoMessage(msg: string) {
  // check if the msg is say no;
  if (msg.toLowerCase().includes('sorry')) {
    // now post message to a dedicated channel
    return true;
  }
  return false;
}

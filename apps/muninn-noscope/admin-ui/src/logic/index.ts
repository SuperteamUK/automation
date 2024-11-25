export const VALID_KEYS = [
  'name',
  'email',
  'phone',
  'x or twiiter',
  'twitter',
  'company',
];

export const composeNoScopeInput = (allKeyvalues: any[]) => {
  const finalKp: any = {};
  allKeyvalues.map((keyValues: any) => {
    window.Object.entries(keyValues).forEach(([key, value]) => {
      if (VALID_KEYS.includes(key)) {
        const objKey = 'contact.' + key;
        if (!finalKp[objKey]) {
          finalKp[objKey] = value;
        } else {
          finalKp[objKey] = `${finalKp[objKey]}, ${value}`;
        }
      }
    });
    return null;
  });
  return finalKp;
};

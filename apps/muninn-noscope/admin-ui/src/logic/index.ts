export const VALID_KEYS = [
  'name',
  'email',
  'phone',
  'x or twiiter',
  'twitter',
  'company',
  'linkedin',
  'telegram',
  'discord',
  'institution',
  'web',
];

export const composeNoScopeInput = (allKeyvalues: any[], name: string) => {
  const finalKp: any = {
    'contact.name': name,
    other: '',
  };
  allKeyvalues.map((keyValues: any) => {
    window.Object.entries(keyValues).forEach(([key, value]) => {
      let val = (value + '').toLowerCase();
      if (VALID_KEYS.includes(key)) {
        const transformedKey = 'contact.' + key;
        const existingVal = finalKp[transformedKey];
        if ((key === 'twitter' || key === 'x or twitter') && val) {
          val = val.replace(/https?:\/\/(www\.)?(twitter\.com|x\.com)\//g, '');
        }
        if (key === 'web' && val) {
          val = val.replace(/https?:\/\//g, '');
        }
        if (key === 'linkedin' && val) {
          val = val.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//g, '');
        }
        if (!existingVal && val) {
          finalKp[transformedKey] = val;
        } else if (existingVal && val) {
          finalKp[transformedKey] = `${existingVal}, ${val}`;
        }
      } else {
        // replace all special character: " , ' * : with '"
        val = val.replace(/["'*:]/g, ' ');
        finalKp['other'] += `${val.trim()} `;
      }
    });
    return null;
  });
  return finalKp;
};

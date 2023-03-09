const zeroCharFiller = (int:number, n:number): string => {
  const str = int.toString();
  const len = str.length;

  let returnStr = str;
  for (let i = 0; i < n - len; i++) {
    returnStr = `0${returnStr}`;
  }

  return returnStr;
};

export default zeroCharFiller;

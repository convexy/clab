// 32 33 34
// 35  B 36
// 37 38 39
//  0  1  2  8  9 10 16 17 18 24 25 26
//  3  W  4 11  R 12 19  Y 20 27  O 28
//  5  6  7 13 14 15 21 22 23 29 30 31
// 40 41 42
// 43  G 44
// 45 46 47

export class RCAction {
  static Wr = new RCAction("Wr");
  static Wl = new RCAction("Wl");
  static Yr = new RCAction("Yr");
  static Yl = new RCAction("Yl");
  static Br = new RCAction("Br");
  static Bl = new RCAction("Bl");
  static Rr = new RCAction("Rr");
  static Rl = new RCAction("Rl");
  static Gr = new RCAction("Gr");
  static Gl = new RCAction("Gl");
  static Or = new RCAction("Or");
  static Ol = new RCAction("Ol");
  static values = [RCAction.Wr, RCAction.Wl, RCAction.Yr, RCAction.Yl, RCAction.Br, RCAction.Bl, RCAction.Rr, RCAction.Rl, RCAction.Gr, RCAction.Gl, RCAction.Or, RCAction.Ol,];
  private constructor(public readonly value: string) { }

  static generateRandomActions(length: number) {
    return Array.from({ length: length }, () => { return RCAction.values[Math.floor(Math.random() * RCAction.values.length)]; });
  }

  static getReversedActions(actions: RCAction[]) {
    const reversed_actions = [...actions].reverse();
    reversed_actions.forEach((value, index, array) => {
      switch (value) {
        case RCAction.Wr: array[index] = RCAction.Wl; break;
        case RCAction.Wl: array[index] = RCAction.Wr; break;
        case RCAction.Yr: array[index] = RCAction.Yl; break;
        case RCAction.Yl: array[index] = RCAction.Yr; break;
        case RCAction.Br: array[index] = RCAction.Bl; break;
        case RCAction.Bl: array[index] = RCAction.Br; break;
        case RCAction.Rr: array[index] = RCAction.Rl; break;
        case RCAction.Rl: array[index] = RCAction.Rr; break;
        case RCAction.Gr: array[index] = RCAction.Gl; break;
        case RCAction.Gl: array[index] = RCAction.Gr; break;
        case RCAction.Or: array[index] = RCAction.Ol; break;
        case RCAction.Ol: array[index] = RCAction.Or; break;
      }
    });
  }

  getTransformation() {
    let transformation: { [key: string]: string } = {};
    switch (this) {
      case RCAction.Wr:
        transformation = {
          "0": "2", "2": "7", "7": "5", "5": "0",
          "1": "4", "4": "6", "6": "3", "3": "1",
          "37": "8", "8": "42", "42": "31", "31": "37",
          "38": "11", "11": "41", "41": "28", "28": "38",
          "39": "13", "13": "40", "40": "26", "26": "39",
        };
        break;
      case RCAction.Wl:
        transformation = {
          "0": "5", "5": "7", "7": "2", "2": "0",
          "1": "3", "3": "6", "6": "4", "4": "1",
          "37": "31", "31": "42", "42": "8", "8": "37",
          "38": "28", "28": "41", "41": "11", "11": "38",
          "39": "26", "26": "40", "40": "13", "13": "39",
        };
        break;
      case RCAction.Yr:
        transformation = {
          "16": "18", "18": "23", "23": "21", "21": "16",
          "17": "20", "20": "22", "22": "19", "19": "17",
          "34": "24", "24": "45", "45": "15", "15": "34",
          "33": "27", "27": "46", "46": "12", "12": "33",
          "32": "29", "29": "47", "47": "10", "10": "32",
        };
        break;
      case RCAction.Yl:
        transformation = {
          "16": "21", "21": "23", "23": "18", "18": "16",
          "17": "19", "19": "22", "22": "20", "20": "17",
          "34": "15", "15": "45", "45": "24", "24": "34",
          "33": "12", "12": "46", "46": "27", "27": "33",
          "32": "10", "10": "47", "47": "29", "29": "32",
        };
        break;
      case RCAction.Br:
        transformation = {
          "32": "34", "34": "39", "39": "37", "37": "32",
          "33": "36", "36": "38", "38": "35", "35": "33",
          "26": "18", "18": "10", "10": "2", "2": "26",
          "25": "17", "17": "9", "9": "1", "1": "25",
          "24": "16", "16": "8", "8": "0", "0": "24",
        };
        break;
      case RCAction.Bl:
        transformation = {
          "32": "37", "37": "39", "39": "34", "34": "32",
          "33": "35", "35": "38", "38": "36", "36": "33",
          "26": "2", "2": "10", "10": "18", "18": "26",
          "25": "1", "1": "9", "9": "17", "17": "25",
          "24": "0", "0": "8", "8": "16", "16": "24",
        };
        break;
      case RCAction.Rr:
        transformation = {
          "8": "10", "10": "15", "15": "13", "13": "8",
          "9": "12", "12": "14", "14": "11", "11": "9",
          "39": "16", "16": "47", "47": "7", "7": "39",
          "36": "19", "19": "44", "44": "4", "4": "36",
          "34": "21", "21": "42", "42": "2", "2": "34",
        };
        break;
      case RCAction.Rl:
        transformation = {
          "8": "13", "13": "15", "15": "10", "10": "8",
          "9": "11", "11": "14", "14": "12", "12": "9",
          "39": "7", "7": "47", "47": "16", "16": "39",
          "36": "4", "4": "44", "44": "19", "19": "36",
          "34": "2", "2": "42", "42": "21", "21": "34",
        };
        break;
      case RCAction.Gr:
        transformation = {
          "40": "42", "42": "47", "47": "45", "45": "40",
          "41": "44", "44": "46", "46": "43", "43": "41",
          "5": "13", "13": "21", "21": "29", "29": "5",
          "6": "14", "14": "22", "22": "30", "30": "6",
          "7": "15", "15": "23", "23": "31", "31": "7",
        };
        break;
      case RCAction.Gl:
        transformation = {
          "40": "45", "45": "47", "47": "42", "42": "40",
          "41": "43", "43": "46", "46": "44", "44": "41",
          "5": "29", "29": "21", "21": "13", "13": "5",
          "6": "30", "30": "22", "22": "14", "14": "6",
          "7": "31", "31": "23", "23": "15", "15": "7",
        };
        break;
      case RCAction.Or:
        transformation = {
          "24": "26", "26": "31", "31": "29", "29": "24",
          "25": "28", "28": "30", "30": "27", "27": "25",
          "32": "0", "0": "40", "40": "23", "23": "32",
          "35": "3", "3": "43", "43": "20", "20": "35",
          "37": "5", "5": "45", "45": "18", "18": "37",
        };
        break;
      case RCAction.Ol:
        transformation = {
          "24": "29", "29": "31", "31": "26", "26": "24",
          "25": "27", "27": "30", "30": "28", "28": "25",
          "32": "23", "23": "40", "40": "0", "0": "32",
          "35": "20", "20": "43", "43": "3", "3": "35",
          "37": "18", "18": "45", "45": "5", "5": "37",
        };
        break;
    }
    return Array.from({ length: 48 }, (_, i) => i).map((_, index) => index.toString() in transformation ? parseInt(transformation[index.toString()]) : index);
  }
}

export type RCState = number[];

export class CVirtualRubiksCube {
  private rcState: RCState;
  constructor() {
    this.rcState = Array.from({ length: 48 }, (_, i) => i);
  }
  getRCState() {
    return [...this.rcState];
  }
  get isGoal() {
    return this.rcState.every((value, index) => value === index);
  }
  get point() {
    return this.rcState.filter((value, index) => value === index).length;
  }
  updateState(action: RCAction) {
    const transformation = action.getTransformation();
    this.rcState.forEach((value, index, array) => array[index] = transformation[value]);
  }
  reset() {
    this.rcState = Array.from({ length: 48 }, (_, i) => i);
  }
  setInitState(initActions: RCAction[]) {
    this.reset();
    for (const action of initActions) this.updateState(action);
  }
  setRandomState(complexity: number) {
    this.reset();
    for (const action of RCAction.generateRandomActions(complexity)) this.updateState(action);
  }
  display() {
    const net: Array<Array<string>> = [];
    net.push(["32", "33", "34"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.push(["35", "B", "36"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.push(["37", "38", "39"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.push(["0", "1", "2", "8", "9", "10", "16", "17", "18", "24", "25", "26"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.push(["3", "W", "4", "11", "R", "12", "19", "Y", "20", "27", "O", "28"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.push(["5", "6", "7", "13", "14", "15", "21", "22", "23", "29", "30", "31"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.push(["40", "41", "42"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.push(["43", "G", "44"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.push(["45", "46", "47"].map((value) => (this.rcState[parseInt(value)]?.toString() ?? value).padStart(2, " ")));
    net.forEach(row => console.log(row.join(" ")));
  }
}

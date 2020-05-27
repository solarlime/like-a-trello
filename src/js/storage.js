export default class Storage {
  static getItems() {
    return JSON.parse(localStorage.getItem('items'));
  }

  static setItems(items) {
    localStorage.setItem('items', JSON.stringify(items));
  }
}

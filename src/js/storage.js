export default class Storage {
  static getItems() {
    return JSON.parse(localStorage.getItem('items'));
  }

  static setItems(items) {
    try {
      localStorage.setItem('items', JSON.stringify(items));
    } catch (error) {
      alert('Oops! The localStorage is almost full! Delete something to set new files.');
    }
  }
}

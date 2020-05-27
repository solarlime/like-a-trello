/* eslint-disable import/no-cycle */
import Storage from './storage';
import Page from './page';
import Modals from './modals';

export default class App {
  static init() {
    const page = new Page();
    App.update();
    page.addListeners();
  }

  static update() {
    Modals.reset();
    document.querySelectorAll('li.column-item').forEach((item) => item.remove());
    if (Storage.getItems()) {
      Storage.getItems().forEach((item) => Page.render(item));
    }
  }
}

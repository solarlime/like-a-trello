/* eslint-disable import/no-cycle */
import Storage from './storage';
import Page from './page';
import Utils from './utils';

export default class App {
  static init() {
    const page = new Page();
    App.update();
    page.addListeners();
  }

  static reset() {
    document.forms['add-and-update'].reset();
    Array.from(document.querySelector('.files').children).forEach((item) => item.remove());
    const file = Array.from(document.querySelector('.modal-file-container').children)
      .find((item) => item.classList.contains('preview') || item.classList.contains('preview-image'));
    const space = document.querySelector('.column-space');
    if (space) {
      space.remove();
    }
    if (file) {
      file.remove();
    }
  }

  static update() {
    App.reset();
    document.querySelectorAll('li.column-item').forEach((item) => item.remove());
    if (Storage.getItems()) {
      Storage.getItems().sort((a, b) => a.order - b.order).forEach((item) => Utils.render(item));
    }
  }
}

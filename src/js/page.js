/* eslint-disable import/no-cycle,no-unused-expressions */
import Modals from './modals';
import validation from './validation';
import MoveItems from './moveItems';
import Utils from './utils';
import Storage from './storage';
import App from './app';

export default class Page {
  constructor() {
    this.page = document.body;
    this.main = this.page.querySelector('main');
    this.board = this.page.querySelector('.board');
    this.pluses = this.page.querySelectorAll('.new');
    this.scrollLeft = this.page.querySelector('.scroll-left');
    this.scrollRight = this.page.querySelector('.scroll-right');
    this.modalAddUpdate = this.page.querySelector('.modal-add-update');
    this.modalDelete = this.page.querySelector('.modal-delete');
    this.modalFile = this.page.querySelector('.modal-file');
    this.form = this.page.querySelector('form#add-and-update');
    this.cancels = this.page.querySelectorAll('button.cancel');
    this.save = this.page.querySelector('button.save');
    this.delete = this.page.querySelector('button.delete');
    this.download = this.page.querySelector('button.download');
    this.fileChooser = this.page.querySelector('input#file');
    this.fakeFile = this.page.querySelector('.fake-file');
    this.column = 'todo';
    this.drag = null;
    // "Дельта" - разница между курсором и левым верхним углом
    // перетаскиваемого элемента. Понадобится при Drag and Drop
    this.delta = { x: 0, y: 0 };
    this.save.disabled = true;
    this.files = [];
    this.filesToSave = [];
  }

  /**
   * Добавляем обработчик события на кнопку. В случае наличия
   * подсказки удаляем её, иначе - отрисовываем.
   */
  addListeners() {
    // Функция для управляющих кнопок
    function actionsButtons(event) {
      // event.target - не всегда <svg>: иногда <path>. Поправляем
      const svg = Utils.getSVG(event.target);
      if (svg.tagName !== 'svg') return null;
      if (svg.classList.value === 'column-item-actions-update') {
        this.targetRow = svg.closest('li');
        this.filesToSave = Modals.show.call(
          this, this.modalAddUpdate, this.targetRow, event.target, this.filesToSave,
        );
      }
      if (svg.classList.value === 'column-item-actions-delete') {
        this.targetRow = svg.closest('li');
        this.filesToSave = Modals.show(this.modalDelete);
      }
      return 1;
    }

    // Обработчики для кнопок 'Add new item'
    this.pluses.forEach((plus) => {
      plus.addEventListener('touchend', (event) => {
        this.targetRow = 0;
        this.filesToSave = Modals.show.call(
          this, this.modalAddUpdate, this.targetRow, event.target, this.filesToSave,
        );
      });
      plus.addEventListener('click', (event) => {
        this.targetRow = 0;
        this.filesToSave = Modals.show.call(
          this, this.modalAddUpdate, this.targetRow, event.target, this.filesToSave,
        );
      });
    });

    // Обработчик нажатий на файлы
    this.board.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const eventResolvedStart = Utils.eventResolver(event);
      const touchStartPoint = { x: eventResolvedStart.pageX, y: eventResolvedStart.pageY };
      // eslint-disable-next-line no-shadow
      this.board.addEventListener('touchend', (event) => {
        event.preventDefault();
        const eventResolvedEnd = Utils.eventResolver(event);
        const touchEndPoint = { x: eventResolvedEnd.pageX, y: eventResolvedEnd.pageY };
        if (Utils.eventResolver(event).target.closest('.file-element')
          && (touchStartPoint.x === touchEndPoint.x) && (touchStartPoint.y === touchEndPoint.y)) {
          Modals.show(this.modalFile, 0, event.target);
        }
      });
    });
    this.board.addEventListener('click', (event) => {
      event.preventDefault();
      if (Utils.eventResolver(event).target.closest('.file-element')) {
        Modals.show(this.modalFile, 0, event.target);
      }
    });

    // Обработчики для кнопок Cancel
    this.cancels.forEach((cancel) => {
      cancel.addEventListener('touchend', (event) => {
        event.preventDefault();
        this.filesToSave = Modals.cancel();
      });
      cancel.addEventListener('click', (event) => {
        event.preventDefault();
        this.filesToSave = Modals.cancel();
      });
    });

    // Обработчики для кнопок 'Edit' и 'Remove'
    this.board.addEventListener('click', (event) => {
      event.preventDefault();
      actionsButtons.call(this, event);
    });
    this.board.addEventListener('touchend', (event) => {
      event.preventDefault();
      actionsButtons.call(this, event);
    });

    // Обработчик проверки поля ввода на валидность
    this.form.querySelector('#description').addEventListener('input', (event) => {
      this.save.disabled = !validation(event.target);
    });

    // Обработчики кнопки 'Save'
    this.save.addEventListener('touchend', (event) => {
      event.preventDefault();
      this.filesToSave = Modals.save(
        this.modalAddUpdate, event.target, this.column, this.targetRow, this.filesToSave,
      );
    });
    this.save.addEventListener('click', (event) => {
      event.preventDefault();
      this.filesToSave = Modals.save(
        this.modalAddUpdate, event.target, this.column, this.targetRow, this.filesToSave,
      );
    });

    // Обработчики кнопки 'Download'
    this.download.addEventListener('click', (event) => {
      event.preventDefault();
      this.download.textContent = 'Wait...';
      this.download.disabled = true;
      event.target.blur();
      const items = Storage.getItems();
      const files = items.flatMap((item) => item.files);
      const previewForDownload = this.page.querySelector('#preview-for-download');
      const fileItem = files.find((file) => file.name === previewForDownload.title);
      const url = document.createElement('a');
      url.download = fileItem.name;
      url.href = fileItem.link;
      url.rel = 'noopener';
      setTimeout(() => {
        url.dispatchEvent(new MouseEvent('click'));
        Modals.cancel();
        this.download.textContent = 'Download';
        this.download.disabled = false;
      }, 1000);
    });

    // Обработчики кнопки 'Delete'
    this.delete.addEventListener('touchend', (event) => {
      event.preventDefault();
      Modals.delete(this.targetRow);
    });
    this.delete.addEventListener('click', (event) => {
      event.preventDefault();
      Modals.delete(this.targetRow);
    });

    // Обработчик кнопки выбора файла
    this.fileChooser.addEventListener('change', (event) => {
      Utils.fileUploader(Array.from(event.target.files),
        this.filesToSave, this.modalAddUpdate, this.save)
        .then(() => {
          this.save.disabled = !validation(event.target.closest('.modal').querySelector('#description'));
        });
    });

    function preventDefaults(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Отменяем стандартное поведение браузера при нативном DnD. Спасибо @joezimjs
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      this.fileChooser.addEventListener(eventName, preventDefaults, false);
      this.page.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      this.fakeFile.addEventListener(eventName, () => {
        this.fakeFile.classList.add('fake-file-ondnd');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      this.fakeFile.addEventListener(eventName, () => {
        this.fakeFile.classList.remove('fake-file-ondnd');
      });
    });

    // Обработчик DnD файлов
    this.fakeFile.addEventListener('drop', (event) => {
      Utils.fileUploader(Array.from(event.dataTransfer.files),
        this.filesToSave, this.modalAddUpdate, this.save)
        .then(() => {
          this.save.disabled = !validation(event.target.closest('.modal').querySelector('#description'));
        });
    });

    // Обработчик кнопок удаления файлов
    this.modalAddUpdate.addEventListener('click', (event) => {
      const svg = Utils.getSVG(event.target);
      if (svg.tagName !== 'svg') return;
      this.filesToSave.splice(this.filesToSave
        .findIndex((item) => item.lastModified.toString() === svg.closest('li')
          .getAttribute('data-time')), 1);
      this.save.disabled = !validation(event.target.closest('.modal').querySelector('#description'));
      svg.closest('li').remove();
    });

    // Обработчики захвата ячейки
    this.board.addEventListener('touchstart', (event) => {
      this.drag = MoveItems.chooseItem(event, this.delta);
      if (!this.drag) {
        // Начальная точка скроллинга
        this.start = event.changedTouches[0].clientX + this.main.scrollLeft;
      } else {
        Utils.renderSpace.call(this, Utils.eventResolver(event), this.drag, 1);
      }
    });
    this.board.addEventListener('mousedown', (event) => {
      this.drag = MoveItems.chooseItem(event, this.delta);
      if (this.drag) {
        Utils.renderSpace.call(this, Utils.eventResolver(event), this.drag, 1);
      }
    });

    // Обработчики перемещения ячейки
    this.board.addEventListener('touchmove', (event) => {
      // Конечная точка скроллинга
      if (!this.drag) {
        this.end = event.changedTouches[0].clientX;
        this.main.scrollLeft = this.start - this.end;
      } else {
        document.elementsFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
          .find((item) => item.classList.contains('column-container'))?.scrollIntoView({ inline: 'center', behavior: 'smooth' });
        document.elementsFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
          .find((item) => item.classList.contains('file-element'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.drag.style.transform = 'rotate(2deg)';
        this.drag.style.left = `${event.changedTouches[0].clientX - this.delta.x}px`;
        this.drag.style.top = `${event.changedTouches[0].clientY - this.delta.y}px`;
        Utils.renderSpace.call(this, Utils.eventResolver(event), this.drag);
      }
    });
    this.board.addEventListener('mousemove', (event) => {
      if (this.drag) {
        this.drag.style.transform = 'rotate(2deg)';
        this.drag.style.left = `${event.clientX - this.delta.x}px`;
        this.drag.style.top = `${event.clientY - this.delta.y}px`;
        Utils.renderSpace.call(this, Utils.eventResolver(event), this.drag);
      }
    });

    // Обработчики 'бросания' ячейки
    this.board.addEventListener('touchend', (event) => {
      this.drag = MoveItems.dropItem(Utils.eventResolver(event), this.drag);
    });
    this.board.addEventListener('mouseup', (event) => {
      if (this.drag) {
        this.drag = MoveItems.dropItem(Utils.eventResolver(event), this.drag);
      }
    });

    // Обработчики "ухода" курсора
    ['mouseleave', 'touchcancel'].forEach((eventName) => {
      this.page.addEventListener(eventName, (event) => {
        if (this.drag) {
          this.drag = null;
          const e = (event.type === 'mouseleave') ? new Event('mouseup') : new Event('touchend');
          this.board.dispatchEvent(e);
          App.update();
        }
      });
    });
  }
}

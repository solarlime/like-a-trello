/* eslint-disable import/no-cycle,no-unused-expressions */
import Modals from './modals';
import validation from './validation';
import MoveItems from './moveItems';
import Utils from './utils';
import Storage from './storage';

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
    this.column = 'todo';
    this.drag = null;
    // "Дельта" - разница между курсором и левым верхним углом
    // перетаскиваемого элемента. Понадобится при Drag and Drop
    this.delta = { x: 0, y: 0 };
    this.save.disabled = true;
    this.fileTypes = [
      'text/plain',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/pdf',
      'application/zip',
    ];
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
    this.board.addEventListener('touchend', (event) => {
      event.preventDefault();
      if (Utils.eventResolver(event).target.closest('.file-element')) {
        Modals.show(this.modalFile, 0, event.target);
      }
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
      this.save.disabled = !validation(event.target, this.save);
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
      this.download.style.disabled = 'true';
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
        this.download.style.disabled = 'false';
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
      const newFiles = Array.from(event.target.files);
      newFiles.forEach((file) => {
        try {
          // Тип файла не поддерживается - отмена
          if (!this.fileTypes.find((fileType) => fileType === file.type)) {
            throw new Error('This file type is not supported');
          }
          Utils.readFile(file)
            .then((result) => {
              this.filesToSave.push(result);
              Utils.renderFiles(this.modalAddUpdate, result);
              this.save.disabled = false;
            })
            .catch((error) => {
              console.log(error);
              throw new Error('Cannot read the file');
            });
        } catch (error) {
          alert(error);
        }
      });
    });

    // Обработчик кнопок удаления файлов
    this.modalAddUpdate.addEventListener('click', (event) => {
      const svg = Utils.getSVG(event.target);
      if (svg.tagName !== 'svg') return;
      this.filesToSave.splice(this.filesToSave
        .findIndex((item) => item.lastModified.toString() === svg.closest('li')
          .getAttribute('data-time')), 1);
      svg.closest('li').remove();
      this.save.disabled = false;
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

    // this.scrollLeft.addEventListener('mousemove', () => this.main
    //   .scrollBy({ left: -100, behavior: 'smooth' }));
    // this.scrollRight.addEventListener('mousemove', () => this.main
    //   .scrollBy({ left: 100, behavior: 'smooth' }));

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
      this.drag = MoveItems.dropItem(Utils.eventResolver(event), this.drag);
    });
  }
}

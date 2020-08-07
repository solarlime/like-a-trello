/* eslint-disable import/no-cycle */
import Modals from './modals';
import validation from './validation';
import MoveItems from './moveItems';
import Utils from './utils';

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
    this.form = this.page.querySelector('form#add-and-update');
    this.cancels = this.page.querySelectorAll('button.cancel');
    this.save = this.page.querySelector('button.save');
    this.delete = this.page.querySelector('button.delete');
    this.fileChooser = this.page.querySelector('input#file');
    this.column = 'todo';
    this.drag = null;
    // "Дельта" - разница между курсором и левым верхним углом
    // перетаскиваемого элемента. Понадобится при Drag and Drop
    this.delta = { x: 0, y: 0 };
    // Example of the data
    // const example = {
    //   items: [
    //     {
    //       id: '11',
    //       order: '2',
    //       column: 'todo',
    //       name: 'Second',
    //     },
    //     {
    //       id: '12',
    //       order: '1',
    //       column: 'todo',
    //       name: 'First',
    //     },
    //     {
    //       id: '13',
    //       order: '4',
    //       column: 'doing',
    //       name: 'Sit',
    //     },
    //     {
    //       id: '14',
    //       order: '3',
    //       column: 'doing',
    //       name: 'Sing',
    //     },
    //     {
    //       id: '21',
    //       order: '2',
    //       column: 'doing',
    //       name: 'Knit',
    //     },
    //     {
    //       id: '22',
    //       order: '1',
    //       column: 'doing',
    //       name: 'Ring',
    //     },
    //     {
    //       id: '31',
    //       order: '2',
    //       column: 'done',
    //       name: 'Go to street',
    //     },
    //     {
    //       id: '32',
    //       order: '1',
    //       column: 'done',
    //       name: 'Make something',
    //     },
    //   ],
    // };
    // localStorage.setItem('items', JSON.stringify(example.items));
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

    // Обработчики для кнопок Cancel
    this.cancels.forEach((cancel) => {
      cancel.addEventListener('touchend', () => { this.filesToSave = Modals.cancel(); });
      cancel.addEventListener('click', () => { this.filesToSave = Modals.cancel(); });
    });

    // Обработчики для кнопок 'Edit' и 'Remove'
    this.board.addEventListener('click', (event) => actionsButtons.call(this, event));
    this.board.addEventListener('touchend', (event) => actionsButtons.call(this, event));

    // Обработчик проверки поля ввода на валидность
    this.form.querySelector('#description').addEventListener('input', (event) => {
      this.save.disabled = !validation(event.target, this.save);
    });

    // Обработчики кнопки 'Save'
    this.save.addEventListener('touchend', (event) => {
      this.filesToSave = Modals.save(
        this.modalAddUpdate, event.target, this.column, this.targetRow, this.filesToSave,
      );
    });
    this.save.addEventListener('click', (event) => {
      this.filesToSave = Modals.save(
        this.modalAddUpdate, event.target, this.column, this.targetRow, this.filesToSave,
      );
    });

    // Обработчики кнопки 'Delete'
    this.delete.addEventListener('touchend', () => Modals.delete(this.targetRow));
    this.delete.addEventListener('click', () => Modals.delete(this.targetRow));

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
              Modals.renderFiles(this.modalAddUpdate, result);
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
        Utils.renderSpace.call(this, Utils.eventCoordinates(event), this.drag, 'down');
      }
    });
    this.board.addEventListener('mousedown', (event) => {
      this.drag = MoveItems.chooseItem(event, this.delta);
      if (this.drag) {
        Utils.renderSpace.call(this, Utils.eventCoordinates(event), this.drag, 'down');
      }
    });

    this.scrollLeft.addEventListener('mousemove', () => this.main.scrollBy({ left: -100, behavior: 'smooth' }));
    this.scrollRight.addEventListener('mousemove', () => this.main.scrollBy({ left: 100, behavior: 'smooth' }));

    // Обработчики перемещения ячейки
    this.board.addEventListener('touchmove', (event) => {
      // Конечная точка скроллинга
      if (!this.drag) {
        this.end = event.changedTouches[0].clientX;
        this.main.scrollLeft = this.start - this.end;
      } else {
        if (document
          .elementsFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
          .find((item) => item === this.scrollLeft)) {
          this.main.scrollBy({ left: -100, behavior: 'smooth' });
        }
        if (document
          .elementsFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
          .find((item) => item === this.scrollRight)) {
          this.main.scrollBy({ left: 100, behavior: 'smooth' });
        }
        this.drag.style.transform = 'rotate(2deg)';
        this.drag.style.left = `${event.changedTouches[0].clientX - this.delta.x}px`;
        this.drag.style.top = `${event.changedTouches[0].clientY - this.delta.y}px`;
        Utils.renderSpace.call(this, Utils.eventCoordinates(event), this.drag);
      }
    });
    this.board.addEventListener('mousemove', (event) => {
      if (this.drag) {
        this.drag.style.transform = 'rotate(2deg)';
        this.drag.style.left = `${event.clientX - this.delta.x}px`;
        this.drag.style.top = `${event.clientY - this.delta.y}px`;
        Utils.renderSpace.call(this, Utils.eventCoordinates(event), this.drag);
      }
    });

    // Обработчики 'бросания' ячейки
    this.board.addEventListener('touchend', (event) => {
      const space = this.board.querySelector('.column-space');
      if (space) {
        space.remove();
      }
      this.drag = MoveItems.dropItem(Utils.eventCoordinates(event), this.drag);
    });
    this.board.addEventListener('mouseup', (event) => {
      const space = this.board.querySelector('.column-space');
      if (space) {
        space.remove();
      }
      this.drag = MoveItems.dropItem(Utils.eventCoordinates(event), this.drag);
    });
  }
}

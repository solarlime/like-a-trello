/* eslint-disable no-param-reassign */
/* eslint-disable import/no-cycle */
import Storage from './storage';
import App from './app';

// Всех, кто меньше, уменьшаем на единицу кроме тех, кто меньше изначального
function changeOrder(items, targetItem, notMovingItemOrder) {
  items.filter((item) => item.column === targetItem.column
    && item.id !== targetItem.id
    && parseInt(item.order, 10) >= notMovingItemOrder)
    .map((item) => {
      if (parseInt(item.order, 10) <= targetItem.order) {
        item.order = parseInt(item.order, 10) - 1;
      }
      return item;
    });
}

export default class MoveItems {
  static chooseItem(event, delta) {
    event.preventDefault();
    if (event.target.classList.contains('column-item-title')) {
      const eventCoordinates = () => ((event.type === 'mousedown') ? event : event.changedTouches[0]);
      // Указатель на перетаскиваемый элемент в DOM
      const drag = document.elementFromPoint(eventCoordinates().clientX, eventCoordinates().clientY).closest('li.column-item');
      if (drag) {
        drag.style.transform = 'rotate(2deg)';
        delta.x = eventCoordinates().pageX - window.scrollX
          - drag.getBoundingClientRect().left;
        delta.y = eventCoordinates().pageY - window.scrollY
          - drag.getBoundingClientRect().top;
        drag.classList.add('drag');
        drag.style.cursor = 'grabbing';
        return drag;
      }
    }
    return null;
  }

  static dropItem(event, drag) {
    if (drag) {
      const eventCoordinates = () => ((event.type === 'mouseup') ? event : event.changedTouches[0]);
      // Новая колонка (если это именно она)
      const column = document
        .elementsFromPoint(eventCoordinates().clientX, eventCoordinates().clientY)
        .find((item) => item.classList.contains('column-container'));
      if (column) {
        MoveItems.putItem(eventCoordinates(), column, drag);
      } else {
        drag.style.transform = '';
        drag.classList.remove('drag');
      }
    }
    return null;
  }

  static putItem(event, column, drag) {
    // Фиксируем старую колонку, понадобится при перестроении колонок
    const oldColumn = drag.closest('.column-container');
    // Элемент, на который навели ячейку
    const firstMovingItem = document.elementsFromPoint(event.clientX, event.clientY)
      .find((item) => item.classList.contains('column-item')
        && item.getAttribute('data-id') !== drag.getAttribute('data-id'));
    const items = Storage.getItems();
    // Указатель на перетаскиваемый элемент в localStorage
    const targetItem = items.find((item) => item.id.toString() === drag.getAttribute('data-id'));
    // Новое значение для колонки
    targetItem.column = column.id;
    // Фиксируем начальные значения ячейки.
    // Важно сохранить order, чтобы отфильтровать лишнее в localStorage
    const notMovingItemOrder = parseInt({ ...targetItem }.order, 10);
    // Вариант 1: колонка не изменилась
    if (oldColumn.id === targetItem.column) {
      // Вариант 1.1: колонка не изменилась, навели на другую ячейку
      if (firstMovingItem) {
        // Ячейке присваиваем (номер элемента - 1), на который навели
        targetItem.order = parseInt(firstMovingItem.getAttribute('data-order'), 10) - 1;
        changeOrder(items, targetItem, notMovingItemOrder);
      } else {
        // Вариант 1.2: колонка не изменилась, навели на пустое место
        // Ячейку ставим последней посредством length
        targetItem.order = items.filter((item) => item.column === targetItem.column).length;
        changeOrder(items, targetItem, notMovingItemOrder);
      }
    } else {
      // Вариант 2: колонка изменилась
      // Заполняем пустоту в старой колонке
      items.filter((item) => item.column === oldColumn.id).map((item) => {
        if (parseInt(item.order, 10) >= notMovingItemOrder) {
          item.order = parseInt(item.order, 10) - 1;
        }
        return item;
      });
      // Вариант 2.1: колонка изменилась, наводим на другую ячейку
      if (firstMovingItem) {
        // Ячейке присваиваем номер элемента, на который навели
        // Всех, кто больше, увеличиваем на единицу
        targetItem.order = parseInt(firstMovingItem.getAttribute('data-order'), 10);
        items.filter((item) => item.column === targetItem.column
          && item.id !== targetItem.id)
          .map((item) => {
            if (parseInt(item.order, 10) >= targetItem.order) {
              item.order = parseInt(item.order, 10) + 1;
            }
            return item;
          });
      } else {
        // Вариант 2.2: колонка изменилась, навели на пустое место
        // Ячейку ставим последней посредством length
        targetItem.order = items.filter((item) => item.column === targetItem.column).length;
      }
    }
    Storage.setItems(items);
    App.update();
  }
}

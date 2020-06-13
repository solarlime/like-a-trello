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

export default function moveItems(event, column, drag, oldColumn) {
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

export default class Utils {
  static getSVG(target) {
    return (!target.ownerSVGElement) ? target : target.ownerSVGElement;
  }

  static eventCoordinates(event) {
    return (event.changedTouches) ? event.changedTouches[0] : event;
  }

  static renderSpace(event, drag, theSameItem = 0) {
    const pointItem = document.elementsFromPoint(event.clientX, event.clientY)
      .find((item) => item.classList.contains('column-item')
        && item.getAttribute('data-id') !== drag.getAttribute('data-id'));
    const pointColumn = document.elementsFromPoint(event.clientX, event.clientY)
      .find((item) => item.classList.contains('column-container'));
    const space = document.querySelector('.column-space');
    const spaceToRemove = drag.closest('.column-container')
      ? drag.closest('.column-container').querySelector('.column-space') : null;
    if (pointColumn && spaceToRemove
      && pointColumn.id !== drag.closest('.column-container').id) {
      spaceToRemove.remove();
    }
    if (pointItem) {
      const element = document.createElement('div');
      element.textContent = 'Put the item here';
      element.classList.add('column-space');
      if (space) {
        space.remove();
      }
      if (!theSameItem) {
        if (event.pageY
          > window.scrollY + pointItem.getBoundingClientRect().top + pointItem.offsetHeight / 2) {
          pointItem.after(element);
        } else {
          pointItem.before(element);
        }
      } else {
        pointItem.before(element);
      }
    }
  }

  static readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', (event) => resolve({
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        link: event.target.result,
      }));
      reader.addEventListener('error', (event) => reject(event.target.error));
      reader.readAsDataURL(file);
    });
  }

  static render(item) {
    const newRow = document.createElement('li');
    newRow.setAttribute('class', 'column-item');
    newRow.setAttribute('data-id', `${item.id}`);
    newRow.setAttribute('data-order', `${item.order}`);
    newRow.innerHTML = `<span class="column-item-title">${item.name}</span>\n`
      + '                            <div class="column-item-actions">\n'
      + '                                <svg class="column-item-actions-update" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 469.336 469.336" xml:space="preserve">\n'
      + '                                    <g><g><path d="M456.836,76.168l-64-64.054c-16.125-16.139-44.177-16.17-60.365,0.031L45.763,301.682c-1.271,1.282-2.188,2.857-2.688,4.587L0.409,455.73c-1.063,3.722-0.021,7.736,2.719,10.478c2.031,2.033,4.75,3.128,7.542,3.128\n'
      + '                c0.979,0,1.969-0.136,2.927-0.407l149.333-42.703c1.729-0.5,3.302-1.418,4.583-2.69l289.323-286.983\n'
      + '                c8.063-8.069,12.5-18.787,12.5-30.192S464.899,84.237,456.836,76.168z M285.989,89.737l39.264,39.264L120.257,333.998\n'
      + '                l-14.712-29.434c-1.813-3.615-5.5-5.896-9.542-5.896H78.921L285.989,89.737z M26.201,443.137L40.095,394.5l34.742,34.742\n'
      + '                L26.201,443.137z M149.336,407.96l-51.035,14.579l-51.503-51.503l14.579-51.035h28.031l18.385,36.771\n'
      + '                c1.031,2.063,2.708,3.74,4.771,4.771l36.771,18.385V407.96z M170.67,390.417v-17.082c0-4.042-2.281-7.729-5.896-9.542\n'
      + '                l-29.434-14.712l204.996-204.996l39.264,39.264L170.67,390.417z M441.784,121.72l-47.033,46.613l-93.747-93.747l46.582-47.001\n'
      + '                c8.063-8.063,22.104-8.063,30.167,0l64,64c4.031,4.031,6.25,9.385,6.25,15.083S445.784,117.72,441.784,121.72z"></path></g></g>\n'
      + '                                </svg>\n'
      + '                                <svg class="column-item-actions-delete" viewBox="-47 0 512 512" xmlns="http://www.w3.org/2000/svg">\n'
      + '                                    <path d="m416.875 114.441406-11.304688-33.886718c-4.304687-12.90625-16.339843-21.578126-29.941406-21.578126h-95.011718v-30.933593c0-15.460938-12.570313-28.042969-28.027344-28.042969h-87.007813c-15.453125 0-28.027343 12.582031-28.027343 28.042969v30.933593h-95.007813c-13.605469 0-25.640625 8.671876-29.945313 21.578126l-11.304687 33.886718c-2.574219 7.714844-1.2695312 16.257813 3.484375 22.855469 4.753906 6.597656 12.445312 10.539063 20.578125 10.539063h11.816406l26.007813 321.605468c1.933594 23.863282 22.183594 42.558594 46.109375 42.558594h204.863281c23.921875 0 44.175781-18.695312 46.105469-42.5625l26.007812-321.601562h6.542969c8.132812 0 15.824219-3.941407 20.578125-10.535157 4.753906-6.597656 6.058594-15.144531 3.484375-22.859375zm-249.320312-84.441406h83.0625v28.976562h-83.0625zm162.804687 437.019531c-.679687 8.402344-7.796875 14.980469-16.203125 14.980469h-204.863281c-8.40625 0-15.523438-6.578125-16.203125-14.980469l-25.816406-319.183593h288.898437zm-298.566406-349.183593 9.269531-27.789063c.210938-.640625.808594-1.070313 1.484375-1.070313h333.082031c.675782 0 1.269532.429688 1.484375 1.070313l9.269531 27.789063zm0 0"></path><path d="m282.515625 465.957031c.265625.015625.527344.019531.792969.019531 7.925781 0 14.550781-6.210937 14.964844-14.21875l14.085937-270.398437c.429687-8.273437-5.929687-15.332031-14.199219-15.761719-8.292968-.441406-15.328125 5.925782-15.761718 14.199219l-14.082032 270.398437c-.429687 8.273438 5.925782 15.332032 14.199219 15.761719zm0 0"></path>\n'
      + '                                    <path d="m120.566406 451.792969c.4375 7.996093 7.054688 14.183593 14.964844 14.183593.273438 0 .554688-.007812.832031-.023437 8.269531-.449219 14.609375-7.519531 14.160157-15.792969l-14.753907-270.398437c-.449219-8.273438-7.519531-14.613281-15.792969-14.160157-8.269531.449219-14.609374 7.519532-14.160156 15.792969zm0 0"></path>\n'
      + '                                    <path d="m209.253906 465.976562c8.285156 0 15-6.714843 15-15v-270.398437c0-8.285156-6.714844-15-15-15s-15 6.714844-15 15v270.398437c0 8.285157 6.714844 15 15 15zm0 0"></path>\n'
      + '                            </div>';
    try {
      document.querySelector(`ul#${item.column}`).append(newRow);
    } catch (e) {
      console.log(e);
    }
  }
}

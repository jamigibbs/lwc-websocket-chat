import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import SOCKET_IO_JS from '@salesforce/resourceUrl/socketiojs';

export default class WebsocketChat extends LightningElement {
  @api timeString;
  _socketIoInitialized = false;

  renderedCallback(){
    if (this._socketIoInitialized) {
      return;
    }
    this._socketIoInitialized = true;

    Promise.all([
      loadScript(this, SOCKET_IO_JS),
    ])
    .then(() => {
      this.initSocketIo();
    })
    .catch(error => {
      this.dispatchEvent(
        new ShowToastEvent({
         title: 'Error loading socket.io',
          message: error.message,
          variant: 'error',
        }),
      );
    });
  }

  initSocketIo(){
    // eslint-disable-next-line no-undef
    const socket = io.connect('https://sf-chat-websocket-server.herokuapp.com/');

    socket.on('time', (timeString) => {
      this.timeString = timeString;
    });
  }
}
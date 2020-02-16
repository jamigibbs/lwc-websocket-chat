import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import { createRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import MESSAGE_OBJECT from '@salesforce/schema/Chat_Message__c';
import CONTENT_FIELD from '@salesforce/schema/Chat_Message__c.Content__c';
import SOCKET_IO_JS from '@salesforce/resourceUrl/socketiojs';
import Id from '@salesforce/user/Id';
import getTodayMessages from '@salesforce/apex/ChatController.getTodayMessages';

export default class WebsocketChat extends LightningElement {
  @api userId = Id;
  @api timeString;
  @api message;
  @api error;

  _socketIoInitialized = false;
  _content;

  @wire(getTodayMessages)
  messages

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

    const textarea = this.template.querySelector('.message-input');

    if (socket !== undefined) {

      socket.on('time', (timeString) => {
        this.timeString = timeString;
      });

      socket.on('output', (data) => {
        this.createMessage(data.message);
      });

      textarea.addEventListener('keydown', (event) => {
        if (!this.userId) {
          this.userId = new Date().toTimeString();
        }

        if (event.which === 13 && event.shiftKey == false) {
          socket.emit('input', {
            name: this.userId,
            message: textarea.value
          })
        }
      });

      socket.on('status', (data) => {
        if (data.success) {
          textarea.value = '';
          this.message = data.message;
          this.error = '';
        } else if (!data.succes) {
          this.error = data.message;
          this.message = '';
        }
      })

    }

  }

  createMessage(content){
    const fields = {};
    fields[CONTENT_FIELD.fieldApiName] = content;
    const messageInput = { apiName: MESSAGE_OBJECT.objectApiName, fields };
    createRecord(messageInput)
      .then(() => {
          //this.accountId = account.id;
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Success',
                  message: 'Message created',
                  variant: 'success',
              }),
          );
          return refreshApex(this.messages);
      })
      .catch(error => {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error creating message',
                  message: error.body.message,
                  variant: 'error',
              }),
          );
      });
  }
}
public with sharing class ChatController {

    @AuraEnabled(cacheable=true)
    public static List<Chat_Message__c> getTodayMessages() {
        
        List<Chat_Message__c> messageList;
        try {
            messageList = [
                SELECT Id, Content__c, CreatedDate, CreatedBy.Name, CreatedBy.MediumPhotoUrl
                FROM Chat_Message__c 
                WHERE CreatedDate = today 
                ORDER BY CreatedDate DESC
            ];
        } catch(Exception e) {
            System.debug(e.getMessage());
            return null;
        }
        return messageList;
    }

    @AuraEnabled
    public static User setUserChatActive() {
        User userToUpdate;
        try {
            userToUpdate = [
                SELECT Id 
                FROM User 
                WHERE Id = :UserInfo.getUserId()
            ];

            userToUpdate.Chat_Active__c = true;
            update userToUpdate;
        } catch(DmlException e) {
            System.debug('An unexpected error has occurred: ' + e.getMessage());
        }
        return userToUpdate;
    }

    @AuraEnabled
    public static User setUserChatInactive() {
        User userToUpdate;
        try {
            userToUpdate = [
                SELECT Id 
                FROM User 
                WHERE Id = :UserInfo.getUserId()
            ];

            userToUpdate.Chat_Active__c = false;
            update userToUpdate;
        } catch(DmlException e) {
            System.debug('An unexpected error has occurred: ' + e.getMessage());
        }
        return userToUpdate;
    }
    
}
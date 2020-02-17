public with sharing class ChatController {
    @AuraEnabled(cacheable=true)
    public static List<Chat_Message__c> getTodayMessages() {
        List<Chat_Message__c> messageList;

        try {
            messageList = [
                SELECT Id, Content__c, CreatedBy.Name
                FROM Chat_Message__c 
                WHERE createdDate = today 
                ORDER BY CreatedDate DESC
            ];
        } catch(Exception e) {
            System.debug(e.getMessage());
            return null;
        }
        return messageList;
    }
}
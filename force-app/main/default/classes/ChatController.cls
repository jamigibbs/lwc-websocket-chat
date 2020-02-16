public with sharing class ChatController {
    @AuraEnabled(cacheable=true)
    public static List<Chat_Message__c> getTodayMessages() {
        return [SELECT Id, OwnerId, Content__c FROM Chat_Message__c WHERE createdDate = today ORDER BY CreatedDate ASC];
    }
}

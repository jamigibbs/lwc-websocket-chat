public with sharing class ChatController {
    @AuraEnabled(cacheable=true)
    public static List<ChatMessage__c> getTodayMessages() {
        return [SELECT Id, OwnerId, Content__c FROM ChatMessage__c WHERE createdDate = today ORDER BY CreatedDate ASC];
    }
}

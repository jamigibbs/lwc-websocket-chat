public inherited sharing class CreateChatMessage {
    @AuraEnabled
    public static void createChatMessage(Message__c message){
        try{
            insert message;
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
}

# NOTICE

This project is no longer in active development. Please see this project (https://github.com/PCAPredict/Dynamics365) that relates to the latest way of integrating into Dynamics with Unified Interface. It is based on our previous version which was developed for Dynamics 2013-2015 (See here : https://www.loqate.com/resources/support/setup-guides/loqate-for-dynamics-crm/).

# Notes

This integration can be used with the event handlers that you can set in the form editor. The script uses the standard tag setup script that Loqate provides, with extensions put in place to best accommodate the Dynamics 365 system. This is intended for dynamics V9.

IMPORTANT NOTE : The type of key required to set the mappings is not currently available through the account section. To resolve this issue you need to get in touch with the Loqate support team where will create a tag service key for you with default mappings set up.

# Current steps to get started.

### Step 1

Dynamics 365 CRM>Settings>Customization>Customize the System

![alt text](images/screenshot1.png)
 
### Step 2

Components>Web Resources

![alt text](images/screenshot2.png)
 
Add the New web resource. Add Dynamics Tag script, save and publish.

![alt text](images/screenshot3.png)
 
### Step 3

Go back to Sales>Contacts
Create a new Contact form. Then click “Form” at the top, followed by “Form properties”.

![alt text](images/screenshot4.png)
 
In the form libraries select add and add the pca script.

![alt text](images/screenshot5.png)
 
After which in the event handlers click add and choose the pca library and in the function type in “startPCA”

![alt text](images/screenshot6.png)
 
Then in the parameters specify the account code and click OK. Make sure to tick the "pass execution context as first parameter" as well.
Make sure Control is “Form” and Event is “OnLoad” and confirm by clicking ok


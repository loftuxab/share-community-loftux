<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/documentlibrary/action/action.lib.js">
//</import>
/*
 * Alfresco Share Symbolic Linc Extension
 * 
 * Copyright (C) 2017 Loftux AB
 * 
 * This file is part of the Symbolic linc extension to the Alfresco software. 
 * 
 * The extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * The Symbolic linc extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 * 
 */

/**
 * CLink files action
 * @method POST
 */

/**
 * Entrypoint required by action.lib.js
 *
 * @method runAction
 * @param p_params {object} Object literal containing files array
 * @return {object|null} object representation of action results
 */
function runAction(p_params)
{
   var results = [],
      destNode = p_params.destNode,
      files = p_params.files,
      file, fileNode, result, nodeRef,
      fromSite, copiedNode;

   // Must have array of files
   if (!files || files.length == 0)
   {
      status.setCode(status.STATUS_BAD_REQUEST, "No files.");
      return;
   }
   
   for (file in files)
   {
      nodeRef = files[file];
      result =
      {
         nodeRef: nodeRef,
         action: "linkFile",
         success: false
      };
      
      try
      {
         fileNode = search.findNode(nodeRef);
         if (fileNode == null)
         {
            result.id = file;
            result.nodeRef = nodeRef;
            result.success = false;
         }
         else
         {
            result.id = fileNode.name;
            result.type = fileNode.isContainer ? "folder" : "document";

            var parentFolder = destNode;
            while(parentFolder  && parentFolder.name != 'documentLibrary' )
            {
               parentAssocs = parentFolder.parentAssocs["cm:contains"];
               if(parentAssocs.length > 1)
               {
                  // One parentfolder is already linked, do not allow linked items withing linked folders.
                  throw('Cannot perform operation since the node has one or more parents already linked.');
               }
               parentFolder = parentFolder.parent;
            }

            destNode.addNode(fileNode);

            // Make sure the target location have read access to file, can only be done if user linking can set permissions
            if(fileNode.hasPermission("ChangePermissions")) {
               var destNodePermissions = destNode.getPermissions(), fileNodePermissions = fileNode.getPermissions().toString();
               // Loop trough old permissions and remove "Everyone"
               for (var i=0, l=destNodePermissions.length; i < l; i++) {
                  // Split the string on ;
                  var permSplit=destNodePermissions[i].split(";");

                  if(fileNodePermissions.indexOf(permSplit[1]) === -1) {
                     if(permSplit[1] != "GROUP_EVERYONE"){
                        // Exclude EVERYONE, since we don't by accident share to everyone
                        fileNode.setPermission("SiteConsumer", permSplit[1]);
                     }
                  }

               }
            }

            result.nodeRef = fileNode.nodeRef.toString();
            result.success = (result.nodeRef != null);

         }
      }
      catch (e)
      {
         result.id = file;
         result.nodeRef = nodeRef;
         result.success = false;

         result.fileExist = false;

         error = e.toString();

         if (error.indexOf("FileExistsException") !== -1 || error.indexOf("Duplicate child name not allowed") !== -1)
         {
            result.fileExist = true;
         }

      }
      
      results.push(result);
   }

   return results;
}

/* Bootstrap action script */
main();

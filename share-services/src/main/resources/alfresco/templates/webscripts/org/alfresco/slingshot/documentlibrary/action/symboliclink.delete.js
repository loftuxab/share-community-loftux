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
* Delete link action
* @method DELETE
* @param uri {string} /{siteId}/{containerId}/{filepath}
*/

/**
* Entrypoint required by action.lib.js
*
* @method runAction
* @param p_params {object} standard action parameters: nodeRef, siteId, containerId, path
* @return {object|null} object representation of action result
*/
function runAction(p_params)
{
   var results;

   try
   {
   var assetNode = p_params.destNode,
   resultId = assetNode.name,
   resultNodeRef = assetNode.nodeRef.toString(), linknode;

   linknode = args.nodeRef ? utils.getNodeFromString(args.nodeRef) : null;
   if(linknode)
   {
      try
      {
         // Try to removed set permissions by linking, but only if not modified manually (i.e still SiteConsumer).
         // First check if it link more than once in this site, then don't remove
         // TODO Fancier check that removes the actual permissions that is not duplicated
         var parentAssocs = linknode.parentAssocs["cm:contains"], currentSite = url.templateArgs['site'], currentSiteCount = 0;

         if(parentAssocs && parentAssocs.length > 1)
         {
            for(var pi = 0; pi < parentAssocs.length; pi++)
            {
               var displayPath = parentAssocs[pi].displayPath.split('/');

               if(displayPath[3] == currentSite){
                  currentSiteCount++;
               }
            }
         }

         if(linknode.hasPermission("ChangePermissions") && currentSiteCount < 2) {
            var assetNodePermissions = assetNode.getPermissions(), linknodePermission = linknode.getDirectPermissions().toString();
            // Loop trough old permissions and remove "Everyone"
            for (var i=0, l=assetNodePermissions.length; i < l; i++) {
               // Split the string on ;
               var permSplit=assetNodePermissions[i].split(";");
               if(permSplit[1] != "GROUP_EVERYONE" && linknodePermission.indexOf(permSplit[1]) > -1){
                  // Exclude EVERYONE, since we don't by accident share to everyone. Only remove direct set permissions.
                  linknode.removePermission("SiteConsumer", permSplit[1]);
               }
            }
         }

         assetNode.removeNode(linknode)
      }
      catch(e)
      {
         status.setCode(status.STATUS_INTERNAL_SERVER_ERROR, "Could not delete link.");
         return;
      }

   }else
   {
      status.setCode(404, "Linked object not found");
      return;
   }

// Construct the result object
results = [
      {
         id: resultId,
         nodeRef: resultNodeRef,
         action: "deleteFile",
         success: true
         }];
}
catch(e)
   {
      status.setCode(status.STATUS_INTERNAL_SERVER_ERROR, e.toString());
      return;
      }

return results;
}

/* Bootstrap action script */
main();

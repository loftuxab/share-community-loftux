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

(function()
{

   YAHOO.Bubbling.fire("registerRenderer",
      {
         propertyName : "symbolicLinkBanner",
         renderer : function(record, label)
         {
            var symlink, count, html = '';
            symlink = record.jsNode.isContainer ? 'symboliclink.folder' : 'symboliclink.document';
            if(record.symbolicLink.isPrimaryLocation)
            {
               symlink += '.primary';
            }
            count = record.symbolicLink.parentLength -1;
            html += '<div class="symbolicLink-banner">';
            html += this.msg(symlink, count);
            html += '</div>';


            return html;
         }
      });

   if(Alfresco.module.DoclibCopyMoveTo)
   {
      Alfresco.module.DoclibCopyMoveTo.prototype.setOptions = function DLCMT_setOptions(obj)
      {
         var myOptions = {};

         if (typeof obj.mode !== "undefined")
         {
            var dataWebScripts =
               {
                  copy: "copy-to",
                  move: "move-to",
                  unzip: "unzip-to",
                  symlink: "link-to"
               };
            if (typeof dataWebScripts[obj.mode] == "undefined")
            {
               throw new Error("Alfresco.module.CopyMoveTo: Invalid mode '" + obj.mode + "'");
            }
            myOptions.dataWebScript = dataWebScripts[obj.mode];
         }

         myOptions.viewMode = Alfresco.util.isValueSet(this.options.siteId) ? Alfresco.module.DoclibGlobalFolder.VIEW_MODE_RECENT_SITES : Alfresco.module.DoclibGlobalFolder.VIEW_MODE_REPOSITORY;
         // Actions module
         this.modules.actions = new Alfresco.module.DoclibActions();

         return Alfresco.module.DoclibCopyMoveTo.superclass.setOptions.call(this, YAHOO.lang.merge(myOptions, obj));
      };

   }

   if (Alfresco.DocumentList)
   {
      Alfresco.DocumentList.prototype._copyMoveTo = function dlA__copyMoveTo(mode, record)
      {
         // Check mode is an allowed one
         if (!mode in
            {
               copy: true,
               move: true,
               unzip: true,
               symlink: true
            })
         {
            throw new Error("'" + mode + "' is not a valid Copy/Move to mode.");
         }

         if (!this.modules.copyMoveTo)
         {
            this.modules.copyMoveTo = new Alfresco.module.DoclibCopyMoveTo(this.id + "-copyMoveTo");
         }
         if(!DLGF) {
            var DLGF = Alfresco.module.DoclibGlobalFolder;
         }

         var allowedViewModes =
            [
               DLGF.VIEW_MODE_RECENT_SITES,
               DLGF.VIEW_MODE_FAVOURITE_SITES,
               DLGF.VIEW_MODE_SITE,
               DLGF.VIEW_MODE_SHARED
            ];

         if (this.options.repositoryBrowsing === true)
         {
            allowedViewModes.push(DLGF.VIEW_MODE_REPOSITORY);
         }

         allowedViewModes.push(DLGF.VIEW_MODE_USERHOME);

         // Loftux - do not allow link to repository folders
         if (mode === 'symlink')
         {
            allowedViewModes =
               [
                  DLGF.VIEW_MODE_RECENT_SITES,
                  DLGF.VIEW_MODE_FAVOURITE_SITES,
                  DLGF.VIEW_MODE_SITE
               ];
         }

         var zIndex = 0;
         if (this.fullscreen !== undefined && ( this.fullscreen.isWindowOnly || Dom.hasClass(this.id, 'alf-fullscreen')))
         {
            zIndex = 1000;
         }

         var parentElement = undefined;
         if (Dom.hasClass(this.id, 'alf-true-fullscreen'))
         {
            parentElement = Dom.get(this.id);
         }

         this.modules.copyMoveTo.setOptions(
            {
               allowedViewModes: allowedViewModes,
               mode: mode,
               siteId: this.options.siteId,
               containerId: this.options.containerId,
               path: this.currentPath,
               files: record,
               /* Fix for MNT-12432. Do not overwrite this.modules.copyMoveTo.options.rootNode option if repoBrowsing is enabled. Could cause Repository tab view inconsistency */
               rootNode: this.options.repositoryBrowsing ? this.modules.copyMoveTo.options.rootNode : this.options.rootNode,
               repositoryRoot: this.options.repositoryRoot,
               parentId: this.getParentNodeRef(record),
               zIndex: zIndex,
               parentElement : parentElement ? parentElement : undefined
            }).showDialog();
      };

      Alfresco.DocumentList.prototype.onActionLinkTo = function dlA_onActionLinkTo(record)
      {
         this._copyMoveTo("symlink", record);
      };

      Alfresco.DocumentList.prototype.onActionLinkList = function dlA_onActionLinkList(record)
      {
         var parentFolders = record.symbolicLink.parentFolders, html = '', displayPath, displayPathDisplay,
            urlTemplate = '/site/{site}/documentlibrary#filter=path%7C{path}',
            obj = {
               site: '',
               path: ''
            };

         html += '<div class="doclist"><div class="documents symbolicLinksListForm">';
         for(i=0; i < parentFolders.length; i++)
         {
            if(parentFolders[i].path === '/' && parentFolders[i].file === 'documentLibrary')
            {
               //It is in root, special display
               displayPath = parentFolders[i].path;
               displayPathDisplay = displayPath + ' ' + this.msg('page.documentLibrary.title')
            }else
            {
               displayPath = (parentFolders[i].path + '/' + parentFolders[i].file).replace('//','/');
               displayPathDisplay = displayPath;
            }
            obj.site = parentFolders[i].site.name;
            obj.path = encodeURIComponent(escape(displayPath));
            html +='<h3 class="filename symbolicLinksList" style="visibility:visible"><a href="' +  Alfresco.util.renderUriTemplate (urlTemplate, obj, true) + '">' + displayPathDisplay +'</a> ('+ parentFolders[i].site.name + ')</h3>';


         }

         html += '</div></div>';
         Alfresco.util.PopupManager.displayPrompt(
            {
               title: this.msg("action.symbolicLinkList.header"),
               text: html,
               noEscape: true
            });
      };

      Alfresco.DocumentList.prototype.onActionLinkDelete = function dlA_onActionLinkDelete(record)
      {
         var me = this;

         if(this.currentFilter.filterId !== 'path')
         {
            Alfresco.util.PopupManager.displayMessage(
               {
                  text:  this.msg("actions.symbolicLinks.delete.notinpath"),
                  effectDuration: 2,
                  noEscape: true
               });
            return
         }


         Alfresco.util.PopupManager.displayPrompt(
            {
               title: this.msg("actions.symbolicLinks.delete.header"),
               text: this.msg("actions.symbolicLinks.delete.text"),
               noEscape: true,
               buttons: [
                  {
                     text: this.msg("button.delete"),
                     handler: function dlA_onActionDelete_delete()
                     {
                        this.destroy();
                        me._onActionLinkDeleteConfirm.call(me, record);
                     }
                  },
                  {
                     text: this.msg("button.cancel"),
                     handler: function dlA_onActionDelete_cancel()
                     {
                        this.destroy();
                     },
                     isDefault: true
                  }]
            });

      };

      Alfresco.DocumentList.prototype._onActionLinkDeleteConfirm = function dlA_onActionLinkDeleteConfirm(record)
      {
         var jsNode = record.jsNode,
            path = record.location.path,
            fileName = record.location.file,
            filePath = Alfresco.util.combinePaths(path, fileName),
            displayName = record.displayName,
            nodeRef = jsNode.nodeRef,
            parentNodeRef = this.getParentNodeRef(record);

         //Special case for document root
         if(path === '/')
         {
            path = ''
         }

         this.modules.actions.genericAction(
            {
               success:
                  {
                     event:
                        {
                           name: jsNode.isContainer ? "folderDeleted" : "fileDeleted",
                           obj:
                              {
                                 path: filePath
                              }
                        },
                     message: this.msg("message.delete.success", displayName)
                  },
               failure:
                  {
                     message: this.msg("message.delete.failure", displayName)
                  },
               webscript:
                  {
                     method: Alfresco.util.Ajax.DELETE,
                     name: "symboliclink/site/{site}/{container}{path}?nodeRef={nodeRef}",
                     params:
                        {
                           site: record.location.site.name,
                           nodeRef: nodeRef.nodeRef,
                           container: record.location.container.name,
                           path: path
                        }
                  },
               wait:
                  {
                     message: this.msg("message.multiple-delete.please-wait")
                  }
            });

      };
   }
})();

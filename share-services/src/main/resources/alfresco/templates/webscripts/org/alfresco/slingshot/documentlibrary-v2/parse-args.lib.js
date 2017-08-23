const THUMBNAIL_NAME = "doclib",
   TYPE_SITES = "st:sites",
   PREF_DOCUMENT_FAVOURITES = "org.alfresco.share.documents.favourites",
   PREF_FOLDER_FAVOURITES = "org.alfresco.share.folders.favourites",
   LIKES_SCHEME = "likesRatingScheme";

var Common =
   {
      /**
       * Cache for site objects
       */
      SiteCache: {},

      /**
       * Gets / caches a site object
       *
       * @method getSite
       * @param siteId {string} Site ID
       */
      getSite: function Common_getSite(siteId)
      {
         if (typeof Common.SiteCache[siteId] != "object")
         {
            Common.SiteCache[siteId] = siteService.getSite(siteId);
         }
         return Common.SiteCache[siteId];
      },

      /**
       * Get the user's favourite docs and folders from our slightly eccentric Preferences Service
       *
       * @method getFavourites
       */
      getFavourites: function Common_getFavourites()
      {
         var prefs = preferenceService.getPreferences(person.properties.userName, PREF_DOCUMENT_FAVOURITES),
            favourites = {},
            arrFavs = [],
            strFavs, f, ff;
         try
         {
            /**
             * Fasten seatbelts...
             * An "eval" could be used here, but the Rhino debugger will complain if throws an exception, which gets old very quickly.
             * e.g. var strFavs = eval('try{(prefs.' + PREF_DOCUMENT_FAVOURITES + ')}catch(e){}');
             */
            if (prefs && prefs.org && prefs.org.alfresco && prefs.org.alfresco.share && prefs.org.alfresco.share.documents)
            {
               strFavs = prefs.org.alfresco.share.documents.favourites;
               if (typeof strFavs == "string")
               {
                  arrFavs = strFavs.split(",");
                  for (f = 0, ff = arrFavs.length; f < ff; f++)
                  {
                     favourites[arrFavs[f]] = true;
                  }
               }
            }
            // Same thing but for folders
            prefs = preferenceService.getPreferences(person.properties.userName, PREF_FOLDER_FAVOURITES);
            if (prefs && prefs.org && prefs.org.alfresco && prefs.org.alfresco.share && prefs.org.alfresco.share.folders)
            {
               strFavs = prefs.org.alfresco.share.folders.favourites;
               if (typeof strFavs == "string")
               {
                  arrFavs = strFavs.split(",");
                  for (f = 0, ff = arrFavs.length; f < ff; f++)
                  {
                     favourites[arrFavs[f]] = true;
                  }
               }
            }
         }
         catch (e)
         {
         }

         return favourites;
      },

      /**
       * Generates a location object literal for a given node.
       * Location is Site-relative unless a libraryRoot node is passed in.
       *
       * @method getLocation
       * @param node {ScriptNode} Node to generate location for
       * @param libraryRoot {ScriptNode} Optional node to work out relative location from.
       * @param parent {ScriptNode} Optional parent to use instead of assuming primary parent path
       * @param linkedSite {String} Optional siteid to parse if not primary parent path
       * @return {object} Location object literal.
       */
      getLocation: function Common_getLocation(node, libraryRoot, parent, linkedSite)
      {
         try
         {
            var location = null,
               qnamePaths,
               displayPaths;

            if (parent)
            {
               qnamePaths = (parent.qnamePath + "/_").split("/");
               displayPaths = (parent.displayPath + "/" + parent.name).split("/");
            }
            else
            {
               qnamePaths = node.qnamePath.split("/");
               displayPaths = node.displayPath.split("/");
            }
            // LOFTUX AB -  try to find the linked location
            if(linkedSite)
            {
               var currentSite, qnamePathsTemp = '', displayPathsTemp = '', notFound = true, parentFolder = node.parent;
               while(notFound && parentFolder  && parentFolder.name != 'documentLibrary' && node.name != 'documentLibrary')
               {
                  qnamePathsTemp = parentFolder.qnamePath.substr(parentFolder.qnamePath.lastIndexOf('/')) + qnamePathsTemp;
                  displayPathsTemp = parentFolder.name + '/' + displayPathsTemp;

                  parentAssocs = parentFolder.parentAssocs["cm:contains"];
                  if(parentAssocs.length > 1)
                  {
                     for(var pi = 0; pi < parentAssocs.length; pi++)
                     {
                        // Ensure we have Read permissions on the destination on the link object
                        if (!parentAssocs[pi].hasPermission("Read")) continue;

                        var qnamePathsTempBase = '', displayPathsTempBase = '';

                        currentSite = parentAssocs[pi].displayPath.split('/');
                        if(currentSite[3] == linkedSite)
                        {
                           // We have a parent association for the current linked site, assume linked there
                           qnamePathsTempBase = parentAssocs[pi].qnamePath + qnamePathsTemp;
                           displayPathsTempBase = parentAssocs[pi].displayPath +'/' + parentAssocs[pi].name + '/' + displayPathsTemp;
                           // Remove trailing slash
                           displayPathsTempBase = displayPathsTempBase.substr(0, displayPathsTempBase.length -1 );
                           qnamePathsTempBase = qnamePathsTempBase.substr(0, qnamePathsTempBase.length -1 );

                           qnamePaths = qnamePathsTempBase.split('/');
                           displayPaths = displayPathsTempBase.split('/');

                           notFound = false;

                           // Assume first one found is the correct location (more than one can be found if linked to multiple locations in same site)
                           break;
                        }
                     }
                  }
                  parentFolder = parentFolder.parent;
               }
            }

            // LOFTUX AB - END

            if (libraryRoot == undefined && qnamePaths[2] != TYPE_SITES)
            {
               libraryRoot = companyhome;
            }

            if (libraryRoot)
            {
               // Generate the path from the supplied library root
               location =
                  {
                     site: null,
                     container: null,
                     path: "/" + displayPaths.slice(libraryRoot.displayPath.split("/").length + 1, displayPaths.length).join("/"),
                     file: node.name
                  };
            }
            else if ((qnamePaths.length > 4) && (qnamePaths[2] == TYPE_SITES))
            {
               siteId = displayPaths[3];
               var siteNode = siteService.getSiteInfo(siteId),
                  containerId = qnamePaths[4].substr(3);

               if (siteNode != null)
               {
                  var containerNode = siteNode.getContainer(containerId);
                  if (containerNode != null)
                  {
                     location =
                        {
                           site: siteId,
                           siteNode: siteNode,
                           siteTitle: siteNode.title,
                           sitePreset: siteNode.sitePreset,
                           container: containerId,
                           containerNode: containerNode,
                           containerType: containerNode.typeShort,
                           path: "/" + displayPaths.slice(5, displayPaths.length).join("/"),
                           file: node.name
                        };
                  }
               }
            }

            if (location == null)
            {
               location =
                  {
                     site: siteId,
                     container: null,
                     path: "/" + displayPaths.slice(2, displayPaths.length).join("/"),
                     file: node.name
                  };
            }
            // add repository path to response
            location.repoPath = "/" + displayPaths.slice(2, displayPaths.length).join("/");
            return location;
         }
         catch(e)
         {
            return null;
         }
      },

      /**
       * Returns an object literal representing the current "likes" rating for a node
       *
       * @method getLikes
       * @param node {ScriptNode} Node to query
       * @return {object} Likes object literal.
       */
      getLikes: function Common_getLikes(node)
      {
         var isLiked = false,
            totalLikes = 0;

         try
         {
            totalLikes = ratingService.getRatingsCount(node, LIKES_SCHEME);
            isLiked = totalLikes === 0 ? false : ratingService.getRating(node, LIKES_SCHEME) !== -1;
         }
         catch (e) {}

         return (
            {
               isLiked: isLiked,
               totalLikes: totalLikes
            });
      }
   };

var ParseArgs =
   {
      /**
       * Get and parse arguments
       *
       * @method getParsedArgs
       * @return {array|null} Array containing the validated input parameters
       */
      getParsedArgs: function ParseArgs_getParsedArgs(containerType)
      {
         var type = url.templateArgs.type,
            libraryRoot = args.libraryRoot,
            rootNode = null,
            pathNode = null,
            nodeRef = null,
            path = "",
            location = null;

         // Is this library rooted from a non-site nodeRef?
         if (libraryRoot !== null)
         {
            libraryRoot = ParseArgs.resolveNode(libraryRoot);
         }

         if (url.templateArgs.store_type !== null)
         {
            /**
             * nodeRef input: store_type, store_id and id
             */
            var storeType = url.templateArgs.store_type,
               storeId = url.templateArgs.store_id,
               id = url.templateArgs.id;

            nodeRef = ParseArgs.resolveNode(storeType + "://" + storeId + "/" + id);
            rootNode = libraryRoot || nodeRef;
            if (rootNode == null)
            {
               status.setCode(status.STATUS_NOT_FOUND, "Not a valid nodeRef: '" + nodeRef + "'");
               return null;
            }

            // Special case: make sure filter picks up correct mode
            if (type == null && args.filter == null)
            {
               args.filter = "node";
            }
         }
         else
         {
            /**
             * Site and container input
             */
            var siteId = url.templateArgs.site,
               containerId = url.templateArgs.container,
               siteNode = siteService.getSiteInfo(siteId);

            if (siteNode === null)
            {
               status.setCode(status.STATUS_GONE, "Site not found: '" + siteId + "'");
               return null;
            }

            rootNode = siteNode.getContainer(containerId);
            if (rootNode === null)
            {
               rootNode = siteNode.aquireContainer(containerId, containerType || "cm:folder", {"cm:description": "Document Library"});
               if (rootNode === null)
               {
                  status.setCode(status.STATUS_GONE, "Document Library container '" + containerId + "' not found in '" + siteId + "'. (No permission?)");
                  return null;
               }
            }
         }

         // Path input?
         path = url.templateArgs.path || "";
         pathNode = path.length > 0 ? rootNode.childByNamePath(path) : (pathNode || rootNode);
         if (pathNode === null)
         {
            status.setCode(status.STATUS_NOT_FOUND, "Path not found: '" + path + "'");
            return null;
         }

         // Parent location parameter adjustment
         var parentNode = null;
         if (path.length > 0)
         {
            var p = path.split("/");
            p.pop();
            parentNode = rootNode.childByNamePath(p.join("/"));
         }

         // LOFTUX AB Symbolic Linking - Start checking if linked.
         var linkedSite = null, currentSite;
         if(url.templateArgs.site)
         {
            var siteIdLinked = url.templateArgs.site;

            // Find out if node is symbolicLinked

            var parentAssocs = pathNode.parentAssocs["cm:contains"];
            if(parentAssocs && parentAssocs.length > 1)
            {
               for(var pi = 0; pi < parentAssocs.length; pi++)
               {
                  // Ensure we have Read permissions on the destination on the link object
                  if (!parentAssocs[pi].hasPermission("Read")) continue;
                  currentSite = parentAssocs[pi].displayPath.split('/');
                  if(currentSite[3] == siteIdLinked)
                  {
                     parentNode = parentAssocs[pi];
                  }
               }
            }

            // It may still be in a folder that is linked
            var parentFolder = (pathNode && pathNode.parent) ? pathNode.parent : null;
            while(!parentNode && parentFolder  && parentFolder.name != 'documentLibrary' && pathNode.name != 'documentLibrary')
            {
               parentAssocs = parentFolder.parentAssocs["cm:contains"];
               if(parentAssocs.length > 1)
               {
                  for(var pi = 0; pi < parentAssocs.length; pi++)
                  {
                     // Ensure we have Read permissions on the destination on the link object
                     if (!parentAssocs[pi].hasPermission("Read")) continue;
                     currentSite = parentAssocs[pi].displayPath.split('/');
                     if(currentSite[3] == siteIdLinked)
                     {
                        // We have a parent association for the current linked site, assume linked there
                        linkedSite = siteIdLinked;
                     }
                  }
               }
               parentFolder = parentFolder.parent ? parentFolder.parent : null;
            }
         }

         if(!parentNode && nodeRef) {
            parentNode = nodeRef.parent;
         }

         // getLocation added with new param to parse linkedSite
         location = Common.getLocation(pathNode, libraryRoot, parentNode, linkedSite);

         // LOFTUX AB - End add link check.
         if (location === null)
         {
            status.setCode(status.STATUS_GONE, "Location is 'null'. (No permission?)");
            return null;
         }
         // ACE-565 fix. Commenting current line causes the incorrect folder navigation into Document Library
         if (path !== "")
         {
            location.path = ParseArgs.combinePaths(location.path, location.file);
         }
         if (location.repoPath)
         {
            location.repoPath = ParseArgs.combinePaths(location.repoPath, location.file);
         }
         if (args.filter !== "node" && !pathNode.isContainer)
         {
            location.file = "";
         }
         
         var objRet =
            {
               rootNode: rootNode,
               pathNode: pathNode,
               libraryRoot: libraryRoot,
               location: location,
               path: path,
               nodeRef: nodeRef ? nodeRef.nodeRef + '' : null,
               type: type
            };

         // Multiple input files in the JSON body?
         var files = ParseArgs.getMultipleInputValues("nodeRefs");
         if (typeof files != "string")
         {
            objRet.files = files;
         }

         return objRet;
      },

      /**
       * Resolve "virtual" nodeRefs into nodes
       *
       * @method resolveVirtualNodeRef
       * @deprecated for ParseArgs.resolveNode
       */
      resolveVirtualNodeRef: function ParseArgs_resolveVirtualNodeRef(nodeRef)
      {
         if (logger.isLoggingEnabled())
         {
            logger.log("WARNING: ParseArgs.resolveVirtualNodeRef is deprecated for ParseArgs.resolveNode");
         }
         return ParseArgs.resolveNode(nodeRef);
      },

      /**
       * Resolve "virtual" nodeRefs, nodeRefs and xpath expressions into nodes
       *
       * @method resolveNode
       * @param reference {string} "virtual" nodeRef, nodeRef or xpath expressions
       * @return {ScriptNode|null} Node corresponding to supplied expression. Returns null if node cannot be resolved.
       */
      resolveNode: function ParseArgs_resolveNode(reference)
      {
         return utils.resolveNodeReference(reference);
      },

      /**
       * Get multiple input files
       *
       * @method getMultipleInputValues
       * @param param {string} Property name containing the files array
       * @return {array|string} Array containing the files, or string error
       */
      getMultipleInputValues: function ParseArgs_getMultipleInputValues(param)
      {
         var values = [],
            error = null;

         try
         {
            // Was a JSON parameter list supplied?
            if (typeof json == "object")
            {
               if (!json.isNull(param))
               {
                  var jsonValues = json.get(param);
                  // Convert from JSONArray to JavaScript array
                  for (var i = 0, j = jsonValues.length(); i < j; i++)
                  {
                     values.push(jsonValues.get(i));
                  }
               }
            }
         }
         catch(e)
         {
            error = e.toString();
         }

         // Return the values array, or the error string if it was set
         return (error !== null ? error : values);
      },

      /**
       * Append multiple parts of a path, ensuring duplicate path separators are removed.
       *
       * @method combinePaths
       * @param path1 {string} First path
       * @param path2 {string} Second path
       * @param ...
       * @param pathN {string} Nth path
       * @return {string} A string containing the combined paths
       */
      combinePaths: function ParseArgs_combinePaths()
      {
         var path = "", i, ii;
         for (i = 0, ii = arguments.length; i < ii; i++)
         {
            if (arguments[i] !== null)
            {
               path += arguments[i] + (arguments[i] !== "/" ? "/" : "");
            }
         }

         return path.replace(/\/{2,}/g, "/").replace(/(.)\/$/g, "$1");
      }
   };

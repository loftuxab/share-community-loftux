<#macro itemJSON item>
   <#local node = item.node>
   <#local version = "1.0">
   <#if node.hasAspect("{http://www.alfresco.org/model/content/1.0}versionable")><#local version = node.properties["cm:versionLabel"]!""></#if>
   <#escape x as jsonUtils.encodeJSONString(x)>
   "version": "${version}",
   "webdavUrl": "${node.webdavUrl}",
      <#if item.activeWorkflows?? && (item.activeWorkflows?size > 0)>"activeWorkflows": ${item.activeWorkflows?size?c},</#if>
      <#if item.isFavourite??>"isFavourite": ${item.isFavourite?string},</#if>
      <#if (item.workingCopyJSON?length > 2)>"workingCopy": <#noescape>${item.workingCopyJSON}</#noescape>,</#if>
      <#if item.likes??>"likes":
      {
      "isLiked": ${item.likes.isLiked?string},
      "totalLikes": ${item.likes.totalLikes?c}
      }</#if>,
      <#-- Loftux Support symbolic link start -->
      <#if item.symbolicLink??>"symbolicLink":
      {
      "parentLength": ${item.symbolicLink.parentLength},
      "isPrimaryLocation": ${item.symbolicLink.isPrimaryLocation?string},
      "parentFolders":
      [
         <#list item.symbolicLink.parents as parent>
         {
            <#if parent.location.site??>
            "site":
            {
            "name": "${(parent.location.site)!""}",
            "title": "${(parent.location.siteTitle)!""}",
            "preset": "${(parent.location.sitePreset)!""}"
            },
            </#if>
            <#if parent.location.container??>
            "container":
            {
            "name": "${(parent.location.container)!""}",
            "type": "${(parent.location.containerType)!""}",
            "nodeRef": "${(parent.location.containerNode.nodeRef)!""}"
            },
            </#if>
         "path": "${(parent.location.path)!""}",
         "file": "${(parent.location.file)!""}",
         "nodeRef": "${(parent.location.nodeRef)!""}"
         }<#if parent_has_next>,</#if>
         </#list>
      ]
      },</#if>
      <#-- Loftux Support symbolic link end -->
   "location":
   {
   "repositoryId": "${(node.properties["trx:repositoryId"])!(server.id)}",
      <#if item.location.site??>
      "site":
      {
      "name": "${(item.location.site)!""}",
      "title": "${(item.location.siteTitle)!""}",
      "preset": "${(item.location.sitePreset)!""}"
      },
      </#if>
      <#if item.location.container??>
      "container":
      {
      "name": "${(item.location.container)!""}",
      "type": "${(item.location.containerType)!""}",
      "nodeRef": "${(item.location.containerNode.nodeRef)!""}"
      },
      </#if>
   "path": "${(item.location.path)!""}",
      "repoPath": "${(item.location.repoPath)!""}",
   "file": "${(item.location.file)!""}",
   "parent":
   {
      <#if (item.location.parent.nodeRef)??>
      "nodeRef": "${item.location.parent.nodeRef}"
      </#if>
   }
   }
   </#escape>
</#macro>
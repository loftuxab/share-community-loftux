/*
 * #%L
 * Alfresco Share WAR
 * %%
 * Copyright (C) 2005 - 2016 Alfresco Software Limited
 * %%
 * This file is part of the Alfresco software. 
 * If the software was purchased under a paid Alfresco license, the terms of 
 * the paid license agreement will prevail.  Otherwise, the software is 
 * provided under the following open source license terms:
 * 
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

package org.alfresco.web.evaluator;

import org.alfresco.error.AlfrescoRuntimeException;
import org.alfresco.web.evaluator.BaseEvaluator;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.simple.JSONObject;

/**
 * Created with IntelliJ IDEA.
 * User: peter
 * Date: 2013-04-11
 * Time: 09:29
 * To change this template use File | Settings | File Templates.
 */
public class IsSymbolicLinked extends BaseEvaluator
{
    private static Log logger = LogFactory.getLog(IsSymbolicLinked.class);
    private boolean evaluatePrimary = false;

    /**
     * Define if isPrimaryLocation should be evaluated. Default false
     *
     * @param evaluatePrimary Boolean
     */
    public void setEvaluatePrimary(boolean evaluatePrimary){
        this.evaluatePrimary = evaluatePrimary;
    }

    /**
     * Checks if a node has symbolic Links (multiple parents)
     *
     *
     * @param jsonObject The object the action is for
     * @return
     */
    @Override
    public boolean evaluate(JSONObject jsonObject)
    {

        try {
            Object symbolicLink = getJSONValue(jsonObject, "symbolicLink");

            if (logger.isDebugEnabled()) {
                logger.debug("LX Evaluator Symbolic link ---- negate " + this.negateOutput);
            }

            if (symbolicLink != null) {
                if (logger.isDebugEnabled()) {
                    logger.debug("LX Evaluator is Symbolic link ");
                }
                if(this.evaluatePrimary) {
                    Boolean isPrimary = (Boolean)getJSONValue(jsonObject, "symbolicLink.isPrimaryLocation");
                    if (logger.isDebugEnabled()) {
                        logger.debug("LX Evaluator is Symbolic link - Evaluating primary to " + isPrimary.toString());
                    }
                    return isPrimary;
                }
                return true;
            } else {
                if (logger.isDebugEnabled()) {
                    logger.debug("LX Evaluator is NOT Symbolic link ");
                }
                return false;
            }

        } catch (Exception err) {
            throw new AlfrescoRuntimeException(
                    "Failed to run action evaluator: " + err.getMessage());
        }
    }
}